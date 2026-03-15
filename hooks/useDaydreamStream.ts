'use client'

/**
 * useDaydreamStream — Manual WHIP implementation
 *
 * We bypass @daydreamlive/react entirely because the SDK's WHIPClient
 * does URL caching + redirect following that breaks with proxy URLs.
 *
 * Manual WHIP flow:
 * 1. Create RTCPeerConnection
 * 2. Add canvas stream tracks
 * 3. Create SDP offer
 * 4. POST offer to /api/whip-proxy (which forwards to Livepeer server-side)
 * 5. Get SDP answer back
 * 6. Set remote description → ICE negotiation begins → video streams
 * 7. For WHEP playback, use a second RTCPeerConnection to receive output
 */

import { useRef, useCallback, useEffect, useState } from 'react'
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

// POST SDP offer to WHIP endpoint via our proxy, get SDP answer
async function sendWhipOffer(whipUrl: string, offer: RTCSessionDescriptionInit): Promise<{ answer: RTCSessionDescriptionInit, location: string }> {
  const proxyUrl = `/api/whip-proxy?url=${encodeURIComponent(whipUrl)}`
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WHIP offer failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const answerSdp = await res.text()
  const location = res.headers.get('location') || ''
  return {
    answer: { type: 'answer', sdp: answerSdp },
    location,
  }
}

// POST SDP offer to WHEP endpoint via proxy, get SDP answer for playback
async function sendWhepOffer(whepUrl: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
  const proxyUrl = `/api/whip-proxy?url=${encodeURIComponent(whepUrl)}`
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: offer.sdp,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WHEP offer failed: ${res.status} ${text.slice(0, 200)}`)
  }
  const answerSdp = await res.text()
  return { type: 'answer', sdp: answerSdp }
}

export function useDaydreamStream(): DaydreamStreamResult {
  const { state } = useApp()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const broadcastPcRef = useRef<RTCPeerConnection | null>(null)
  const playbackPcRef = useRef<RTCPeerConnection | null>(null)
  const canvasStreamRef = useRef<MediaStream | null>(null)
  const streamIdRef = useRef<string | null>(null)
  const paramUpdateTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [status, setStatus] = useState<StreamStatus>('disconnected')
  const [statusMessage, setStatusMessage] = useState('')

  const stopStream = useCallback(() => {
    broadcastPcRef.current?.close()
    playbackPcRef.current?.close()
    broadcastPcRef.current = null
    playbackPcRef.current = null
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
      setStatusMessage('Connecting broadcast...')

      // ── Broadcast: send canvas to Livepeer via manual WHIP ──────────────
      const broadcastPc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      broadcastPcRef.current = broadcastPc

      const canvasStream = createAnimatedCanvasStream()
      canvasStreamRef.current = canvasStream
      canvasStream.getTracks().forEach(track => broadcastPc.addTrack(track, canvasStream))

      broadcastPc.oniceconnectionstatechange = () => {
        console.log('[CineGen] Broadcast ICE:', broadcastPc.iceConnectionState)
      }

      const offer = await broadcastPc.createOffer()
      await broadcastPc.setLocalDescription(offer)

      // Wait for ICE gathering to complete
      await new Promise<void>(resolve => {
        if (broadcastPc.iceGatheringState === 'complete') { resolve(); return }
        broadcastPc.onicegatheringstatechange = () => {
          if (broadcastPc.iceGatheringState === 'complete') resolve()
        }
        setTimeout(resolve, 3000) // max 3s wait
      })

      const { answer, location } = await sendWhipOffer(whipUrl, broadcastPc.localDescription!)
      console.log('[CineGen] WHIP answer received, location:', location)
      await broadcastPc.setRemoteDescription(answer)

      setStatusMessage('Broadcast live, warming up GPU...')

      // Wait for broadcast ICE to connect
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Broadcast ICE timeout')), 15000)
        const check = () => {
          const s = broadcastPc.iceConnectionState
          if (s === 'connected' || s === 'completed') { clearTimeout(timeout); resolve() }
          else if (s === 'failed') { clearTimeout(timeout); reject(new Error('Broadcast ICE failed')) }
        }
        broadcastPc.oniceconnectionstatechange = check
        check()
      })

      console.log('[CineGen] Broadcast ICE connected — waiting for pipeline...')
      setStatusMessage('Warming up GPU... 30s')

      // Get WHEP URL — poll briefly, but connect player as soon as URL is available
      // even if fps is still 0. Player connecting may trigger pipeline to start.
      let whepUrl: string | null = null
      const pollStart = Date.now()
      while (Date.now() - pollStart < 30000) {
        await new Promise(r => setTimeout(r, 3000))
        const s = await fetch(`/api/stream?id=${streamId}`).then(r => r.json()).catch(() => ({}))
        const elapsed = Math.round((Date.now() - pollStart) / 1000)
        setStatusMessage(`Warming up GPU... ${elapsed}s`)
        console.log(`[CineGen] Pipeline @ ${elapsed}s fps:${s.outputFps} whep:${!!s.whepUrl}`)
        if (s.whepUrl) {
          whepUrl = s.whepUrl
          console.log('[CineGen] WHEP URL ready, connecting player (fps may still be 0)')
          break
        }
      }

      if (!whepUrl) throw new Error('No WHEP URL received after 30 seconds')
      console.log('[CineGen] Pipeline ready, connecting player to:', whepUrl)
      setStatusMessage('Connecting player...')

      // ── Playback: receive AI output via manual WHEP ─────────────────────
      const playbackPc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      })
      playbackPcRef.current = playbackPc

      playbackPc.addTransceiver('video', { direction: 'recvonly' })
      playbackPc.addTransceiver('audio', { direction: 'recvonly' })

      playbackPc.ontrack = (event) => {
        console.log('[CineGen] Got track:', event.track.kind)
        if (event.track.kind === 'video' && videoRef.current) {
          const stream = event.streams[0] || new MediaStream([event.track])
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
          setStatus('ready')
          setStatusMessage('Live')
        }
      }

      const playOffer = await playbackPc.createOffer()
      await playbackPc.setLocalDescription(playOffer)

      await new Promise<void>(resolve => {
        if (playbackPc.iceGatheringState === 'complete') { resolve(); return }
        playbackPc.onicegatheringstatechange = () => {
          if (playbackPc.iceGatheringState === 'complete') resolve()
        }
        setTimeout(resolve, 3000)
      })

      const playAnswer = await sendWhepOffer(whepUrl, playbackPc.localDescription!)
      await playbackPc.setRemoteDescription(playAnswer)
      console.log('[CineGen] WHEP connected')

    } catch (err: any) {
      console.error('[CineGen] Stream error:', err)
      setStatus('error')
      setStatusMessage(err.message || 'Connection failed')
      stopStream()
    }
  }, [state.params, stopStream])

  // Debounced param updates
  useEffect(() => {
    if (status !== 'ready' || !streamIdRef.current) return
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
            guidanceScale: 1,
            numInferenceSteps: 1,
          }),
        })
      } catch (err) {
        console.error('[CineGen] Param update failed:', err)
      }
    }, 600)
  }, [state.params.prompt, state.params.transformStrength, status])

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