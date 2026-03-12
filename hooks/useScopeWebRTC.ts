'use client'

/**
 * useScopeWebRTC.ts
 *
 * Connects directly to Daydream Scope's server at localhost:8000 via WebRTC.
 * No Python backend needed — Scope IS the backend.
 *
 * Flow:
 *   1. Poll /scope-api/health until Scope is up
 *   2. Load the 'longlive' pipeline via REST
 *   3. Poll pipeline status until loaded
 *   4. Get ICE servers, create RTCPeerConnection
 *   5. Create data channel for live param updates
 *   6. Send WebRTC offer with initial prompt → get answer → ICE exchange
 *   7. Attach incoming video track to a <video> element
 *   8. On any prompt/param change → send over data channel (no reconnect needed)
 *
 * The video element ref is passed in from the component.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { useApp } from '@/context/AppContext'

// All REST calls go through Next.js rewrites → localhost:8000
const SCOPE = '/scope-api'

export type ScopeStatus =
  | 'disconnected'   // Scope not reachable
  | 'connecting'     // Polling health / loading pipeline
  | 'loading'        // Pipeline loading (can take 2–3 min on remote inference)
  | 'ready'          // WebRTC connected, video streaming
  | 'error'          // Unrecoverable error

export interface ScopeWebRTCResult {
  status: ScopeStatus
  statusMessage: string
  videoRef: React.RefObject<HTMLVideoElement>
  startStream: () => Promise<void>
  stopStream: () => void
  sendParams: () => void
}

export function useScopeWebRTC(): ScopeWebRTCResult {
  const { state } = useApp()
  const videoRef    = useRef<HTMLVideoElement>(null)
  const pcRef       = useRef<RTCPeerConnection | null>(null)
  const dcRef       = useRef<RTCDataChannel | null>(null)
  const sessionRef  = useRef<string | null>(null)
  const queuedICE   = useRef<RTCIceCandidate[]>([])
  const mountedRef  = useRef(true)

  const [status, setStatus]   = useState<ScopeStatus>('disconnected')
  const [message, setMessage] = useState('Scope not connected')

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const safe = useCallback((fn: () => void) => {
    if (mountedRef.current) fn()
  }, [])

  // ── Send current params over data channel ─────────────────────────────────
  const sendParams = useCallback(() => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return
    const p = state.params
    // Scope parameter format for LongLive / StreamDiffusion
    dc.send(JSON.stringify({
      prompts: [{ text: p.prompt || 'beautiful abstract light', weight: 1.0 }],
      // Map our 0–1 sliders to Scope's expected ranges
      guidance_scale: 1 + p.transformStrength * 6,        // 1–7
      num_inference_steps: Math.round(1 + p.smoothness * 3), // 1–4
      strength: p.motionSpeed,                              // 0–1
    }))
  }, [state.params])

  // Auto-send params whenever prompt or sliders change
  useEffect(() => {
    sendParams()
  }, [state.params.prompt, state.params.motionSpeed, state.params.transformStrength, state.params.smoothness])

  // ── ICE candidate sender ───────────────────────────────────────────────────
  const sendICE = useCallback(async (candidate: RTCIceCandidate) => {
    const sid = sessionRef.current
    if (!sid) return
    await fetch(`${SCOPE}/api/v1/webrtc/offer/${sid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidates: [{
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
        }],
      }),
    })
  }, [])

  // ── Stop stream ───────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    dcRef.current?.close()
    pcRef.current?.close()
    dcRef.current  = null
    pcRef.current  = null
    sessionRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    safe(() => {
      setStatus('disconnected')
      setMessage('Stream stopped')
    })
  }, [safe])

  // ── Start full connection sequence ────────────────────────────────────────
  const startStream = useCallback(async () => {
    safe(() => { setStatus('connecting'); setMessage('Checking Scope server…') })

    // 1. Health check — Scope must be running
    try {
      const h = await fetch(`${SCOPE}/health`)
      if (!h.ok) throw new Error('not ok')
    } catch {
      safe(() => { setStatus('error'); setMessage('Scope not reachable. Is the app running?') })
      return
    }

    // 2. Load pipeline
    safe(() => { setStatus('loading'); setMessage('Loading LongLive pipeline…') })
    try {
      await fetch(`${SCOPE}/api/v1/pipeline/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_ids: ['longlive'] }),
      })
    } catch {
      safe(() => { setStatus('error'); setMessage('Failed to load pipeline') })
      return
    }

    // 3. Poll until loaded (remote inference can take 2–5 min)
    safe(() => { setMessage('Pipeline loading… (this can take 2–5 min on remote inference)') })
    for (let i = 0; i < 120; i++) {  // max 4 min at 2s intervals
      await new Promise(r => setTimeout(r, 2000))
      if (!mountedRef.current) return
      try {
        const s = await fetch(`${SCOPE}/api/v1/pipeline/status`)
        const { status: ps } = await s.json()
        if (ps === 'loaded') break
        if (ps === 'error') {
          safe(() => { setStatus('error'); setMessage('Pipeline failed to load') })
          return
        }
        // Update countdown
        const remaining = Math.round((120 - i) * 2)
        safe(() => setMessage(`Pipeline loading… (~${remaining}s remaining)`))
      } catch { /* keep polling */ }
    }

    // 4. Get ICE servers
    let iceServers: RTCIceServer[] = []
    try {
      const ir = await fetch(`${SCOPE}/api/v1/webrtc/ice-servers`)
      const id = await ir.json()
      iceServers = id.iceServers || []
    } catch { /* fall back to Google STUN */ }

    if (!iceServers.length) {
      iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]
    }

    // 5. Create peer connection
    const pc = new RTCPeerConnection({ iceServers })
    pcRef.current = pc
    queuedICE.current = []

    // 6. Data channel for live parameter updates
    const dc = pc.createDataChannel('parameters', { ordered: true })
    dcRef.current = dc

    dc.onopen = () => {
      safe(() => { setStatus('ready'); setMessage('Streaming') })
      sendParams()
    }

    dc.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'stream_stopped') {
          safe(() => { setStatus('error'); setMessage(msg.error_message || 'Stream stopped') })
          stopStream()
        }
      } catch {}
    }

    // 7. Receive video track → attach to <video>
    pc.ontrack = (e) => {
      if (e.streams?.[0] && videoRef.current) {
        videoRef.current.srcObject = e.streams[0]
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        safe(() => { setStatus('error'); setMessage('WebRTC connection dropped') })
      }
    }

    // 8. Trickle ICE
    pc.onicecandidate = async (e) => {
      if (!e.candidate) return
      if (sessionRef.current) {
        await sendICE(e.candidate)
      } else {
        queuedICE.current.push(e.candidate)
      }
    }

    // 9. Receive-only video transceiver (T2V — no input video)
    pc.addTransceiver('video')

    // 10. Create offer → send to Scope
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    safe(() => setMessage('Establishing WebRTC connection…'))

    let answer: any
    try {
      const resp = await fetch(`${SCOPE}/api/v1/webrtc/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription!.sdp,
          type: pc.localDescription!.type,
          initialParameters: {
            prompts: [{ text: state.params.prompt || 'beautiful abstract light rays', weight: 1.0 }],
            denoising_step_list: [1000, 750, 500, 250],
            manage_cache: true,
          },
        }),
      })
      answer = await resp.json()
    } catch {
      safe(() => { setStatus('error'); setMessage('WebRTC signalling failed') })
      return
    }

    sessionRef.current = answer.sessionId

    await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp })

    // 11. Flush queued ICE candidates
    for (const c of queuedICE.current) await sendICE(c)
    queuedICE.current = []

  }, [state.params.prompt, sendParams, sendICE, stopStream, safe])

  return {
    status,
    statusMessage: message,
    videoRef,
    startStream,
    stopStream,
    sendParams,
  }
}
