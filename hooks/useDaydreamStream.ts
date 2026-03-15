'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useApp } from '@/context/AppContext'
import { useBroadcast } from '@daydreamlive/react'
import { usePlayer } from '@daydreamlive/react' // or use a manual WHEP if needed

export type StreamStatus = 'disconnected' | 'creating' | 'connecting' | 'ready' | 'error'

export interface DaydreamStreamResult {
  status: StreamStatus
  statusMessage: string
  videoRef: React.RefObject<HTMLVideoElement>
  startStream: () => Promise<void>
  stopStream: () => void
  streamId: string | null
}

function createAnimatedCanvasStream(): MediaStream & { _cleanup?: () => void } {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512

  // Keep hidden but attached — SDK may handle throttling better
  canvas.style.position = 'absolute'
  canvas.style.left = '-9999px'
  canvas.style.top = '-9999px'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  let frame = 0
  let running = true

  const draw = () => {
    if (!running) return
    frame++
    const hue = (frame * 4) % 360
    ctx.fillStyle = `hsl(${hue}, 90%, 60%)`
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 40px Arial'
    ctx.fillText(`Frame ${frame}`, 80, 260)
    requestAnimationFrame(draw)
  }
  draw()

  const stream = canvas.captureStream(30) as MediaStream & { _cleanup?: () => void }

  stream._cleanup = () => {
    running = false
    if (canvas.parentNode) document.body.removeChild(canvas)
  }

  return stream
}

export function useDaydreamStream(): DaydreamStreamResult {
  const { state } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasStreamRef = useRef<MediaStream & { _cleanup?: () => void } | null>(null)
  const streamIdRef = useRef<string | null>(null)

  const [status, setStatus] = useState<StreamStatus>('disconnected')
  const [statusMessage, setStatusMessage] = useState('')

  // ── SDK Broadcast Hook ──────────────────────────────────────────────────
  const { whepUrl, error: broadcastError, isConnected } = useBroadcast({
    stream: canvasStreamRef.current ?? undefined, // pass when ready
    // Optional: add bitrate, codec preferences if needed
    // e.g. constraints: { video: { frameRate: 30 } }
  })

  // ── SDK Player Hook ─────────────────────────────────────────────────────
  const { error: playerError } = usePlayer({
    url: whepUrl,
    videoRef: videoRef.current ?? undefined,
  })

  const stopStream = useCallback(() => {
    // SDK handles disconnection internally on stream null / unmount
    canvasStreamRef.current?._cleanup?.()
    canvasStreamRef.current?.getTracks().forEach(t => t.stop())
    canvasStreamRef.current = null
    streamIdRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('disconnected')
    setStatusMessage('')
  }, [])

  const startStream = useCallback(async () => {
    try {
      setStatus('creating')
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

      const { streamId, whipUrl } = data
      streamIdRef.current = streamId
      console.log('[CineGen] Stream created:', streamId, 'WHIP:', whipUrl)

      setStatus('connecting')
      setStatusMessage('Preparing canvas broadcast...')

      // Create & attach canvas stream
      const canvasStream = createAnimatedCanvasStream()
      canvasStreamRef.current = canvasStream

      // The useBroadcast hook will pick up the stream automatically
      // (or you can pass it explicitly if the hook supports dynamic updates)

      setStatusMessage('Broadcasting canvas — waiting for pipeline...')

      // Monitor via whepUrl appearance + broadcastError
      if (broadcastError) throw new Error(`Broadcast error: ${broadcastError.message}`)

    } catch (err: any) {
      console.error('[CineGen] Stream error:', err)
      setStatus('error')
      setStatusMessage(err.message || 'Failed to start')
      stopStream()
    }
  }, [state.params, stopStream, broadcastError])

  // Status updates from SDK
  useEffect(() => {
    if (broadcastError) {
      setStatus('error')
      setStatusMessage(`Broadcast failed: ${broadcastError.message}`)
    } else if (isConnected && whepUrl) {
      setStatus('ready')
      setStatusMessage('Live — AI processing active')
    } else if (canvasStreamRef.current) {
      setStatus('connecting')
      setStatusMessage('Connected to WHIP — warming up...')
    }
  }, [isConnected, whepUrl, broadcastError])

  // Cleanup on unmount / stop
  useEffect(() => () => stopStream(), [stopStream])

  return {
    status,
    statusMessage,
    videoRef,
    startStream,
    stopStream,
    streamId: streamIdRef.current,
  }
}