'use client'

import React from 'react'
import FluidSimulation from 'fluid-simulation-react'
import { useApp } from '@/context/AppContext'
import { getPresetById } from '@/lib/presets'

export const FluidPreviewCanvas = React.forwardRef<HTMLCanvasElement>((_, forwardedRef) => {
  const { state } = useApp()
  const params = state.params
  const preset = getPresetById(params.activePresetId)

  // Map CineGen sliders to fluid props (adjust multipliers as needed for feel)
  const fluidProps = {
    // Physics / motion
    densityDissipation: 0.96 + params.motionSpeed * 0.08,      // higher motionSpeed → slower fade (more persistent swirls)
    velocityDissipation: 0.95 + params.motionSpeed * 0.06,
    vorticity: 10 + params.atmosphere * 60,                    // atmosphere slider = curl/swirl strength
    pressureIterations: 20,
    curl: 25 + params.atmosphere * 20,

    // Interaction / visuals
    splatRadius: 0.004 + params.brightness * 0.015,
    splatForce: 5000 + params.brightness * 3000,
    bloom: params.fxGlow,
    bloomIntensity: 0.7 + params.brightness * 1.2,
    bloomThreshold: 0.55,
    sunrays: params.atmosphere > 0.25,
    sunraysWeight: 0.8 + params.atmosphere * 0.8,

    // State controls
    paused: params.freeze,

    // Other defaults (can expose more if the lib supports)
    shading: true,
    colorful: true,
    backColor: { r: 0, g: 0, b: 0 },
  }

  // Optional: trigger color change via preset (library uses random by default; splats will pick up new hues on drag)
  const splatColor = preset?.colors?.[0]
    ? hexToRgb(preset.colors[0])
    : { r: 1, g: 0.7, b: 0.3 } // fallback warm tone

  const currentLyric = state.lyricsEnabled && state.lyricsLines.length > 0
    ? state.lyricsLines[state.activeLyricIndex]
    : ''

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <FluidSimulation
        {...fluidProps}
        style={{ width: '100%', height: '100%', touchAction: 'none' }}
        ref={(canvasEl) => {
          if (canvasEl) {
            if (typeof forwardedRef === 'function') {
              forwardedRef(canvasEl)
            } else if (forwardedRef) {
              forwardedRef.current = canvasEl
            }
          }
        }}
      />

      {/* Lyrics overlay */}
      {currentLyric && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 px-8 text-center"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize: 'clamp(20px, 3.5vw, 42px)',
            color: '#ffffff',
            textShadow: '0 0 50px rgba(0,0,0,0.9)',
            lineHeight: 1.25,
            padding: '0 40px',
          }}
        >
          {currentLyric}
        </div>
      )}

      {/* Blackout layer */}
      {params.blackout && <div className="absolute inset-0 bg-black z-20" />}
    </div>
  )
})

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 }
}