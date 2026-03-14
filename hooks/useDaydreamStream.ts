'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useBroadcast, usePlayer } from '@daydreamlive/react'
import { useApp } from '@/context/AppContext'

export type StreamStatus = 'disconnected' | 'creating' | 'connecting' | 'ready' | 'error'

export interface DaydreamStreamResult {
  status: StreamStatus
  statusMessage: string
  videoRef: { readonly current: HTMLVideoElement | null }  // matches SDK's RefObject<HTMLVideoElement | null>
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
  const [whipUrl, setWhipUrl] = useState<string>('')
  const [streamId, setStreamId] = useState<string | null>(null)
  const [appStatus, setAppStatus] = useState<StreamStatus>('disconnected')
  const [statusMessage, setStatusMessage] = useState('')
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const paramUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // useBroadcast — fix: no video config (use only supported options)
  const broadcast = useBroadcast({
    whipUrl,
    reconnect: { enabled: true, maxAttempts: 5 },
  })

  // Only pass whepUrl to player when broadcast is live
  const liveWhepUrl = broadcast.status.state === 'live' ? broadcast.status.whepUrl : ''

  // usePlayer — fix: only takes one arg (whepUrl), options are second arg if supported
  const player = usePlayer(liveWhepUrl)

  // Sync broadcast state
  useEffect(() => {
    const s = broadcast.status.state
    console.log('[CineGen] Broadcast:', s)
    if (s === 'connecting') {
      setAppStatus('connecting')
      setStatusMessage('Connecting broadcast...')
    } else if (s === 'live') {
      setAppStatus('connecting')
      setStatusMessage('Broadcast live, starting player...')
    } else if (s === 'error') {
      setAppStatus('error')
      const msg = (broadcast.status as any).error?.message ?? 'Broadcast error'
      setStatusMessage(msg)
    } else if (s === 'ended' || s === 'idle') {
      if (appStatus !== 'disconnected') {
        setAppStatus('disconnected')
        setStatusMessage('')
      }
    }
  }, [broadcast.status.state])

  // Sync player state
  useEffect(() => {
    const s = player.status.state
    console.log('[CineGen] Player:', s)
    if (s === 'playing') {
      setAppStatus('ready')
      setStatusMessage('Live')
    } else if (s === 'buffering') {
      setStatusMessage('Buffering...')
    } else if (s === 'error') {
      setAppStatus('error')
      const msg = (player.status as any).error?.message ?? 'Player error'
      setStatusMessage(msg)
    }
  }, [player.status.state])

  const startStream = useCallback(async () => {
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
          guidanceScale: 1.2,
          numInferenceSteps: 2,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to create stream')

      console.log('[CineGen] Stream created:', data.streamId, 'WHIP:', data.whipUrl)
      setStreamId(data.streamId)
      setWhipUrl(data.whipUrl)

      const canvasStream = createAnimatedCanvasStream()
      canvasStreamRef.current = canvasStream
      await broadcast.start(canvasStream)

    } catch (err: any) {
      console.error('[CineGen] Start error:', err)
      setAppStatus('error')
      setStatusMessage(err.message || 'Connection failed')
    }
  }, [state.params, broadcast])

  const stopStream = useCallback(() => {
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
            guidanceScale: 1.2,
            numInferenceSteps: 2,
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