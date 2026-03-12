'use client'

/**
 * CenterPreview — cleaned up HUD overlays.
 *
 * Changes from previous version:
 *   • Removed StrengthRing — value is shown in the Motion tab slider, no need to duplicate
 *   • StatsHUD reduced to 2 pills max: active preset name + one state flag (freeze/blackout)
 *   • Corner brackets kept — they frame the canvas nicely and cost nothing
 *   • ScopePreview status chip sits bottom-right (its own zone)
 *   • All HUD elements use pointerEvents:none so they never block canvas interaction
 *   • Lyric keyboard shortcut hint removed from HUD — it's in the Lyrics tab
 */

import React from 'react'
import { useApp } from '@/context/AppContext'
import { MockPreviewCanvas } from './MockPreviewCanvas'
import { ScopePreview } from './ScopePreview'
import { getPresetById } from '@/lib/presets'

// Subtle corner brackets — visual frame only
function CornerBrackets() {
  const s: React.CSSProperties = {
    position: 'absolute', width: 12, height: 12, zIndex: 10, pointerEvents: 'none',
  }
  const b = '1.5px solid rgba(255,255,255,0.22)'
  return (
    <>
      <div style={{ ...s, top: 10, left: 10,   borderTop: b, borderLeft: b }} />
      <div style={{ ...s, top: 10, right: 10,  borderTop: b, borderRight: b }} />
      <div style={{ ...s, bottom: 10, left: 10,  borderBottom: b, borderLeft: b }} />
      <div style={{ ...s, bottom: 10, right: 10, borderBottom: b, borderRight: b }} />
    </>
  )
}

// Minimal HUD — just preset name and active state flags
function MinimalHUD() {
  const { state } = useApp()
  const { params } = state
  const preset = getPresetById(params.activePresetId)

  // Only show state flags that are actively set — not defaults
  const flags = [
    params.freeze   && { label: '⏸ FROZEN',   color: '#60b4ff', border: 'rgba(50,145,255,0.3)' },
    params.blackout && { label: '■ BLACKOUT',  color: '#f87171', border: 'rgba(239,68,68,0.3)' },
  ].filter(Boolean) as { label: string; color: string; border: string }[]

  return (
    <div style={{
      position: 'absolute', top: 12, left: 14,
      display: 'flex', flexDirection: 'column', gap: 4,
      zIndex: 10, pointerEvents: 'none',
    }}>
      {/* Preset name — always visible */}
      {preset && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: 10,
            color: '#5eead4', fontWeight: 600, letterSpacing: '0.06em',
          }}>
            {preset.name.toUpperCase()}
          </span>
        </div>
      )}

      {/* State flags — only when active */}
      {flags.map(({ label, color, border }) => (
        <div key={label} style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '3px 8px', borderRadius: 4,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
          border: `1px solid ${border}`,
        }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, color, fontWeight: 600, letterSpacing: '0.04em' }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}

// Layer order (bottom → top):
//   1. MockPreviewCanvas — always running, canvas for recording
//   2. ScopePreview — WebRTC video + non-blocking status chip
//   3. CornerBrackets + MinimalHUD — decorative chrome, pointer-events:none
export const CenterPreview = React.forwardRef<HTMLCanvasElement>(function CenterPreview(_, ref) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div className="preview-canvas-wrap" style={{ position: 'relative', flex: 1 }}>

        {/* Layer 1: always-on canvas */}
        <MockPreviewCanvas ref={ref} />

        {/* Layer 2: Scope live video + status chip */}
        <ScopePreview />

        {/* Layer 3: minimal HUD — never blocks anything */}
        <CornerBrackets />
        <MinimalHUD />
      </div>
    </div>
  )
})
