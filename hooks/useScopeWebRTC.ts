'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useApp } from '@/context/AppContext'

const SCOPE = '/scope-api'

export type ScopeStatus =
  | 'disconnected'
  | 'connecting'
  | 'loading'
  | 'ready'
  | 'error'

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

  const sendParams = useCallback(() => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return
    const p = state.params

    const payload = {
      prompts: [{ text: p.prompt || 'beautiful abstract light', weight: 1.0 }],
      guidance_scale: 1 + p.transformStrength * 6,
      num_inference_steps: Math.round(1 + p.smoothness * 3),
      strength: p.motionSpeed,
    }

    // For V2V: reinforce conditioning on every param update
    if (state.sourceVideoStream) {
      Object.assign(payload, {
        strength: p.transformStrength || 0.65,       // 0.0 = ignore input, 1.0 = strong follow
        conditioning_scale: p.transformStrength * 1.0,
        motion_bucket_id: Math.round(p.motionSpeed * 255),
      })
    }

    dc.send(JSON.stringify(payload))
  }, [state.params, state.sourceVideoStream])

  useEffect(() => {
    sendParams()
  }, [state.params.prompt, state.params.motionSpeed, state.params.transformStrength, state.params.smoothness, sendParams])

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

  const startStream = useCallback(async () => {
    safe(() => { setStatus('connecting'); setMessage('Checking Scope server…') })

    try {
      const h = await fetch(`${SCOPE}/health`)
      if (!h.ok) throw new Error('not ok')
    } catch {
      safe(() => { setStatus('error'); setMessage('Scope not reachable. Is the app running?') })
      return
    }

    safe(() => { setStatus('loading'); setMessage('Loading pipeline… (first time can take 10–40 min)') })
    try {
      await fetch(`${SCOPE}/api/v1/pipeline/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_ids: ['longlive'] }), // or ['streamdiffusion-v2'] for lighter
      })
    } catch {
      safe(() => { setStatus('error'); setMessage('Failed to load pipeline') })
      return
    }

    for (let i = 0; i < 180; i++) {
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
        safe(() => setMessage(`Pipeline loading… (~${Math.round((180 - i) * 2)}s remaining)`))
      } catch {}
    }

    let iceServers: RTCIceServer[] = []
    try {
      const ir = await fetch(`${SCOPE}/api/v1/webrtc/ice-servers`)
      const id = await ir.json()
      iceServers = id.iceServers || []
    } catch {}
    if (!iceServers.length) iceServers = [{ urls: 'stun:stun.l.google.com:19302' }]

    const pc = new RTCPeerConnection({ iceServers })
    pcRef.current = pc
    queuedICE.current = []

    if (state.sourceVideoStream) {
      const videoTrack = state.sourceVideoStream.getVideoTracks()[0]
      if (videoTrack) {
        pc.addTrack(videoTrack, state.sourceVideoStream)
        console.log('[WebRTC] Added source video track → V2V conditioning enabled')
        const sender = pc.getSenders().find(s => s.track?.kind === 'video')
        if (sender) {
          try {
            const params = sender.getParameters()
            if (params.encodings?.[0]) {
              params.encodings[0].maxBitrate = 2000000
              await sender.setParameters(params)
            }
          } catch (e) {
            console.warn('Encoding params failed', e)
          }
        }
      }
    }

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

    pc.ontrack = (e) => {
      if (e.streams?.[0] && videoRef.current) {
        videoRef.current.srcObject = e.streams[0]
        console.log('[WebRTC] Received remote video track')
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        safe(() => { setStatus('error'); setMessage('WebRTC connection dropped') })
      }
    }

    pc.onicecandidate = async (e) => {
      if (!e.candidate) return
      if (sessionRef.current) await sendICE(e.candidate)
      else queuedICE.current.push(e.candidate)
    }

    pc.addTransceiver('video', { direction: 'recvonly' })

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    safe(() => setMessage('Establishing WebRTC connection…'))

    let answer: any
    try {
      const initialParams: Record<string, any> = {
        prompts: [{ text: state.params.prompt || 'beautiful cinematic scene', weight: 1.0 }],
        denoising_step_list: [1000, 750, 500, 250],
        manage_cache: true,
      }

      // T2V vs V2V switching
      if (state.sourceVideoStream) {
        // V2V mode
        initialParams.strength = state.params.transformStrength || 0.65
        initialParams.conditioning_scale = state.params.transformStrength || 0.65
        initialParams.init_video = true  // or try: conditioning_video: true
        initialParams.input_source = 'video'
        initialParams.motion_bucket_id = Math.round(state.params.motionSpeed * 255)
        console.log('[Offer] Sending V2V conditioning params')
      } else {
        // Pure T2V
        initialParams.strength = 0.0  // no input conditioning
        console.log('[Offer] Pure T2V mode')
      }

      const resp = await fetch(`${SCOPE}/api/v1/webrtc/offer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdp: pc.localDescription!.sdp,
          type: pc.localDescription!.type,
          initialParameters: initialParams,
        }),
      })

      if (!resp.ok) {
        const err = await resp.text()
        throw new Error(`Offer failed: ${err}`)
      }

      answer = await resp.json()
    } catch (err) {
      console.error(err)
      safe(() => { setStatus('error'); setMessage('WebRTC signalling failed') })
      return
    }

    sessionRef.current = answer.sessionId

    await pc.setRemoteDescription({ type: answer.type, sdp: answer.sdp })

    for (const c of queuedICE.current) await sendICE(c)
    queuedICE.current = []

  }, [state.params.prompt, state.sourceVideoStream, sendParams, sendICE, stopStream, safe])

  return {
    status,
    statusMessage: message,
    videoRef,
    startStream,
    stopStream,
    sendParams,
  }
}