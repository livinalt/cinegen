'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useApp } from '@/context/AppContext'

export function useAudioReact() {
  const { state, dispatch } = useApp()
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)

  const smoothedEnergy = useRef(0)
  const smoothedBass = useRef(0)

  const analyze = useCallback(() => {
    if (!analyserRef.current) return

    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)

    // Overall energy
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i]
    const rawEnergy = sum / (data.length * 255)

    // Bass energy (first ~10 bins ≈ 0–200 Hz)
    const bassSum = data.slice(0, 10).reduce((a, b) => a + b, 0)
    const rawBass = bassSum / (10 * 255)

    // EMA smoothing
    smoothedEnergy.current = 0.85 * smoothedEnergy.current + 0.15 * rawEnergy
    smoothedBass.current = 0.80 * smoothedBass.current + 0.20 * rawBass

    // React only if toggled on
    if (state.audioReactive && state.audioEnabled && smoothedEnergy.current > 0.10) {
      const intensity = Math.min(1, smoothedEnergy.current * 2.2)
      const bassIntensity = Math.min(1, smoothedBass.current * 3.0)

      dispatch({
        type: 'UPDATE_PARAMS',
        payload: {
          motionSpeed: Math.min(1, 0.4 + bassIntensity * 1.4),
          transformStrength: Math.min(1, 0.3 + intensity * 1.1),
        },
      })
    }

    rafRef.current = requestAnimationFrame(analyze)
  }, [dispatch, state.audioReactive, state.audioEnabled])

  const start = useCallback((audioEl: HTMLAudioElement) => {
    if (audioContextRef.current) return

    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.85

    const source = ctx.createMediaElementSource(audioEl)
    source.connect(analyser)
    analyser.connect(ctx.destination)

    audioContextRef.current = ctx
    analyserRef.current = analyser
    sourceRef.current = source

    analyze()
  }, [analyze])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    sourceRef.current?.disconnect()
    analyserRef.current?.disconnect()
    audioContextRef.current?.close()
    audioContextRef.current = null
  }, [])

  useEffect(() => {
    if (!state.audioFileUrl) {
      stop()
      return
    }

    const audio = document.querySelector('audio') as HTMLAudioElement | null
    if (audio && state.audioEnabled) {
      const onPlay = () => start(audio)
      const onPause = stop
      const onEnded = stop

      audio.addEventListener('play', onPlay)
      audio.addEventListener('pause', onPause)
      audio.addEventListener('ended', onEnded)

      if (!audio.paused) onPlay()

      return () => {
        audio.removeEventListener('play', onPlay)
        audio.removeEventListener('pause', onPause)
        audio.removeEventListener('ended', onEnded)
        stop()
      }
    }
  }, [state.audioFileUrl, state.audioEnabled, start, stop])

  return { isActive: !!audioContextRef.current }
}