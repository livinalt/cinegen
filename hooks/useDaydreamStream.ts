'use client'

/**
 * useDaydreamStream — official Daydream API integration
 *
 * Flow:
 *   1. User clicks "Connect GPU"
 *   2. We call POST /api/stream (server-side) → get whipUrl + streamId
 *   3. We create a silent canvas MediaStream (blank input for T2V)
 *   4. createBroadcast({ whipUrl, stream }) → connect → get whepUrl
 *   5. createPlayer(whepUrl) → connect → attachTo(videoRef)
 *   6. AI-processed video now plays in videoRef
 *   7. On prompt/param change → PATCH /api/stream with new params
 *
 * No local Scope needed. All inference runs on Daydream cloud GPUs.
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { useApp } from '@/context/AppContext'

export type StreamStatus =
  | 'disconnected'
  | 'creating'      // calling POST /api/stream
  | 'connecting'    // broadcast + player connecting
  | 'ready'         // live, video playing
  | 'error'

export interface DaydreamStreamResult {
  status: StreamStatus
  statusMessage: string
  videoRef: React.RefObject<HTMLVideoElement>
  startStream: () => Promise<void>
  stopStream: () => void
  streamId: string | null
}

// Dynamically import browser SDK to avoid SSR issues
async function loadBrowserSDK() {
  // @daydreamlive/browser exports createBroadcast and createPlayer
  // We use dynamic import so it only loads client-side
  const mod = await import('@daydreamlive/browser')
  return { createBroadcast: mod.createBroadcast, createPlayer: mod.createPlayer }
}

// Create a silent black canvas stream for T2V input
// Daydream's StreamDiffusion uses the prompt to generate visuals;
// it needs a video input stream but the content doesn't matter for pure T2V
function createSilentCanvasStream(): MediaStream {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 512, 512)

  // Keep canvas alive with a minimal animation
  const draw = () => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, 512, 512)
    requestAnimationFrame(draw)
  }
  draw()

  // @ts-ignore — captureStream is available in all modern browsers
  return canvas.captureStream(30)
}

export function useDaydreamStream(): DaydreamStreamResult {
  const { state } = useApp()
  const videoRef = useRef<HTMLVideoElement>(null)
  const broadcastRef = useRef<any>(null)
  const playerRef = useRef<any>(null)
  const streamIdRef = useRef<string | null>(null)
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const paramUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<StreamStatus>('disconnected')
  const [statusMessage, setStatusMessage] = useState('')

  // ── Stop everything ────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    broadcastRef.current?.stop?.()
    playerRef.current?.stop?.()
    canvasStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop())
    broadcastRef.current = null
    playerRef.current = null
    canvasStreamRef.current = null
    streamIdRef.current = null
    setStatus('disconnected')
    setStatusMessage('')
  }, [])

  // ── Start stream ───────────────────────────────────────────────────────────
  const startStream = useCallback(async () => {
    try {
      setStatus('creating')
      setStatusMessage('Creating AI stream...')

      const p = state.params

      // 1. Create stream on Daydream (server-side, key never exposed)
      const createRes = await fetch('/api/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: p.prompt || 'beautiful abstract light rays, ethereal golden atmosphere',
          guidanceScale: 1 + p.transformStrength * 5,  // 1–6
          numInferenceSteps: Math.round(1 + p.smoothness * 3), // 1–4
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok || createData.error) {
        throw new Error(createData.error || 'Failed to create stream')
      }

      const { streamId, whipUrl } = createData
      streamIdRef.current = streamId
      setStatusMessage('Connecting broadcast...')
      setStatus('connecting')

      // 2. Load Browser SDK
      const { createBroadcast, createPlayer } = await loadBrowserSDK()

      // 3. Create silent canvas stream for T2V input
      const canvasStream = createSilentCanvasStream()
      canvasStreamRef.current = canvasStream

      // 4. Start broadcast → sends canvas stream to Daydream
      const broadcast = createBroadcast({
        whipUrl,
        stream: canvasStream,
        reconnect: { enabled: true, maxAttempts: 3 },
        video: { maxBitrate: 1500000, maxFramerate: 30 },
      })
      broadcastRef.current = broadcast

      broadcast.on('error', (err: any) => {
        console.error('Broadcast error:', err)
        setStatus('error')
        setStatusMessage('Broadcast error: ' + err.message)
      })

      await broadcast.connect()
      setStatusMessage('Starting player...')

      // 5. broadcast.whepUrl is now available (captured from WHIP response header)
      const whepUrl = broadcast.whepUrl
      if (!whepUrl) throw new Error('No WHEP URL received from Daydream')

      // 6. Create player → receives AI-transformed output
      const player = createPlayer(whepUrl, {
        reconnect: { enabled: true, maxAttempts: 5 },
      })
      playerRef.current = player

      player.on('stateChange', (s: string) => {
        if (s === 'playing') {
          setStatus('ready')
          setStatusMessage('Live')
        } else if (s === 'error') {
          setStatus('error')
          setStatusMessage('Playback error')
        }
      })

      player.on('error', (err: any) => {
        console.error('Player error:', err)
        setStatus('error')
        setStatusMessage('Player error: ' + err.message)
      })

      await player.connect()

      // 7. Attach player output to our video element
      if (videoRef.current) {
        player.attachTo(videoRef.current)
      }

    } catch (err: any) {
      console.error('Daydream stream error:', err)
      setStatus('error')
      setStatusMessage(err.message || 'Connection failed')
      stopStream()
    }
  }, [state.params, stopStream])

  // ── Update params when prompt or sliders change ────────────────────────────
  useEffect(() => {
    if (status !== 'ready' || !streamIdRef.current) return

    // Debounce — don't spam PATCH on every keystroke
    if (paramUpdateTimer.current) clearTimeout(paramUpdateTimer.current)
    paramUpdateTimer.current = setTimeout(async () => {
      const p = state.params
      try {
        await fetch('/api/stream', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamId: streamIdRef.current,
            prompt: p.prompt,
            guidanceScale: 1 + p.transformStrength * 5,
            numInferenceSteps: Math.round(1 + p.smoothness * 3),
          }),
        })
      } catch (err) {
        console.error('Param update failed:', err)
      }
    }, 600)
  }, [state.params.prompt, state.params.transformStrength, state.params.smoothness, status])

  // Cleanup on unmount
  useEffect(() => () => { stopStream() }, [])

  return {
    status,
    statusMessage,
    videoRef,
    startStream,
    stopStream,
    streamId: streamIdRef.current,
  }
}
