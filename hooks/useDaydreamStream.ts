'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useBroadcast, usePlayer } from '@daydreamlive/react'
import { useApp } from '@/context/AppContext'

export type StreamStatus = 'disconnected' | 'creating' | 'connecting' | 'ready' | 'error'

export interface DaydreamStreamResult {
  status: StreamStatus
  statusMessage: string
  videoRef: { readonly current: HTMLVideoElement | null }
  startStream: () => Promise<void>
  stopStream: () => void
  streamId: string | null
}

function createAnimatedCanvasStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  let frame = 0
  const draw = () => {
    frame++
    const val = Math.floor(Math.sin(frame * 0.01) * 10 + 10)
    ctx.fillStyle = `rgb(${val},${val},${val})`
    ctx.fillRect(0, 0, 512, 512)
    requestAnimationFrame(draw)
  }
  draw()
  // @ts-ignore
  return canvas.captureStream(30)
}

export function useDaydreamStream(): DaydreamStreamResult {
  const { state } = useApp()

  // Keep whipUrl in a ref so useBroadcast doesn't re-init on every render
  const [whipUrl, setWhipUrl] = useState<string>('')
  const [streamId, setStreamId] = useState<string | null>(null)
  const [appStatus, setAppStatus] = useState<StreamStatus>('disconnected')
  const [statusMessage, setStatusMessage] = useState('')
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const paramUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedRef = useRef(false)

  // Only initialize useBroadcast with a real URL — empty string = idle, no connection attempt
  const broadcast = useBroadcast({
    whipUrl: whipUrl || undefined,
    reconnect: { enabled: true, maxAttempts: 5 },
  })

  // Only connect player once broadcast is live and we have a whepUrl
  const liveWhepUrl = broadcast.status.state === 'live' ? broadcast.status.whepUrl : ''
  const player = usePlayer(liveWhepUrl)

  // Sync broadcast state → app status
  useEffect(() => {
    const s = broadcast.status.state
    if (s === 'idle') return // ignore idle — means not started yet
    console.log('[CineGen] Broadcast:', s)
    if (s === 'connecting') {
      setAppStatus('connecting')
      setStatusMessage('Connecting broadcast...')
    } else if (s === 'live') {
      setAppStatus('connecting')
      setStatusMessage('Broadcast live, starting player...')
    } else if (s === 'reconnecting') {
      setStatusMessage('Reconnecting...')
    } else if (s === 'error') {
      if (!startedRef.current) return // ignore errors before we started
      setAppStatus('error')
      setStatusMessage((broadcast.status as any).error?.message ?? 'Broadcast error')
    } else if (s === 'ended') {
      if (startedRef.current) {
        setAppStatus('disconnected')
        setStatusMessage('')
        startedRef.current = false
      }
    }
  }, [broadcast.status.state])

  // Sync player state → app status
  useEffect(() => {
    const s = player.status.state
    if (s === 'idle') return
    console.log('[CineGen] Player:', s)
    if (s === 'playing') {
      setAppStatus('ready')
      setStatusMessage('Live')
    } else if (s === 'buffering') {
      setStatusMessage('Buffering...')
    } else if (s === 'error') {
      setAppStatus('error')
      setStatusMessage((player.status as any).error?.message ?? 'Player error')
    }
  }, [player.status.state])

  const startStream = useCallback(async () => {
    // Prevent double-start
    if (startedRef.current) return
    startedRef.current = true

    try {
      setAppStatus('creating')
      setStatusMessage('Creating AI stream...')

      const p = state.params
      const res = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p.prompt || 'beautiful abstract light rays, ethereal golden atmosphere',
          modelId: 'stabilityai/sd-turbo',
          guidanceScale: 1,
          numInferenceSteps: 1,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create stream')

      console.log('[CineGen] Stream created:', data.streamId, 'WHIP:', data.whipUrl)
      setStreamId(data.streamId)

      // Set whipUrl FIRST — this wires up useBroadcast
      setWhipUrl(data.whipUrl)

      // Then start broadcasting the canvas stream
      const canvasStream = createAnimatedCanvasStream()
      canvasStreamRef.current = canvasStream
      await broadcast.start(canvasStream)

    } catch (err: any) {
      console.error('[CineGen] Start error:', err)
      startedRef.current = false
      setAppStatus('error')
      setStatusMessage(err.message || 'Connection failed')
    }
  }, [state.params, broadcast])

  const stopStream = useCallback(() => {
    startedRef.current = false
    broadcast.stop()
    player.stop()
    canvasStreamRef.current?.getTracks().forEach(t => t.stop())
    canvasStreamRef.current = null
    setWhipUrl('')
    setStreamId(null)
    setAppStatus('disconnected')
    setStatusMessage('')
  }, [broadcast, player])

  // Debounced param updates
  useEffect(() => {
    if (appStatus !== 'ready' || !streamId) return
    if (paramUpdateTimer.current) clearTimeout(paramUpdateTimer.current)
    paramUpdateTimer.current = setTimeout(async () => {
      const p = state.params
      try {
        await fetch('/api/stream', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId,
            prompt: p.prompt,
            guidanceScale: 1,
            numInferenceSteps: 1,
          }),
        })
      } catch (err) {
        console.error('[CineGen] Param update failed:', err)
      }
    }, 600)
  }, [state.params.prompt, state.params.transformStrength, appStatus, streamId])

  return {
    status: appStatus,
    statusMessage,
    videoRef: player.videoRef,
    startStream,
    stopStream,
    streamId,
  }
}