'use client'

/**
 * ScopePreview — non-blocking Scope connection UX
 *
 * DESIGN PRINCIPLE: The app is ALWAYS usable. Scope is an enhancement,
 * not a requirement. The mock canvas runs underneath at all times.
 *
 * State → UI mapping:
 *   disconnected  → subtle corner chip "Mock preview | Connect Scope"
 *   connecting    → slim top banner with indeterminate progress bar
 *   loading       → slim top banner with cancel, expandable detail
 *   ready         → live video fades in, tiny live chip in corner
 *   error         → dismissible error chip in corner (keep working)
 */

import React, { useState } from 'react'
import { Loader2, WifiOff, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useScopeWebRTC, ScopeStatus } from '@/hooks/useScopeWebRTC'

const MONO: React.CSSProperties = { fontFamily: 'DM Mono, monospace' }

function StatusChip({ status, onStart, onDismiss }: {
  status: 'disconnected' | 'error'
  onStart: () => void
  onDismiss: () => void
}) {
  const isError = status === 'error'
  return (
    <div style={{
      position: 'absolute', bottom: 14, right: 14, zIndex: 30,
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 8px 5px 10px', borderRadius: 20,
      background: isError ? 'rgba(239,68,68,0.18)' : 'rgba(10,10,20,0.72)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
    }}>
      <WifiOff size={11} style={{ color: isError ? '#ef4444' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
      <span style={{ ...MONO, fontSize: 10, letterSpacing: '0.03em',
        color: isError ? '#ef4444' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' as const }}>
        {isError ? 'Scope error' : 'Mock preview'}
      </span>
      <button onClick={onStart} style={{
        ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
        padding: '2px 9px', borderRadius: 10, cursor: 'pointer',
        background: isError ? 'rgba(239,68,68,0.2)' : 'var(--accent-muted)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.5)' : 'var(--accent-border)'}`,
        color: isError ? '#ef4444' : 'var(--accent)',
        transition: 'opacity 0.15s',
      }}>
        {isError ? 'Retry' : 'Connect Scope'}
      </button>
      {isError && (
        <button onClick={onDismiss} title="Dismiss" style={{
          display: 'flex', alignItems: 'center',
          background: 'none', border: 'none', padding: '1px',
          color: 'rgba(255,255,255,0.25)', cursor: 'pointer',
        }}>
          <X size={11} />
        </button>
      )}
    </div>
  )
}

function LoadingBanner({ message, onCancel }: { message: string; onCancel: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
      background: 'rgba(5,5,15,0.85)',
      backdropFilter: 'blur(8px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
        <Loader2 size={13} style={{
          color: 'var(--accent)', flexShrink: 0,
          animation: 'spin 1s linear infinite',
        }} />
        {/* Progress track */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 4, minWidth: 0 }}>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: '40%', borderRadius: 2,
              background: 'var(--accent)',
              animation: 'indeterminate 1.8s ease-in-out infinite',
            }} />
          </div>
          <span style={{ ...MONO, fontSize: 10, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
            {message}
          </span>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', display: 'flex', padding: 2, flexShrink: 0,
        }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        <button onClick={onCancel} style={{
          ...MONO, fontSize: 10, padding: '2px 9px', borderRadius: 4,
          background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer', flexShrink: 0,
        }}>
          Cancel
        </button>
      </div>
      {expanded && (
        <div style={{ padding: '6px 12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ ...MONO, fontSize: 9, color: 'rgba(255,255,255,0.28)', lineHeight: 1.9, letterSpacing: '0.07em' }}>
            SCOPE MUST BE RUNNING AT LOCALHOST:8000<br/>
            REMOTE INFERENCE STARTUP: 2–5 MIN<br/>
            CANVAS PREVIEW IS ACTIVE — YOU CAN KEEP WORKING
          </p>
        </div>
      )}
    </div>
  )
}

function LiveChip({ onStop }: { onStop: () => void }) {
  return (
    <div style={{
      position: 'absolute', bottom: 14, right: 14, zIndex: 30,
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '4px 8px 4px 10px', borderRadius: 20,
      background: 'rgba(34,197,94,0.13)',
      border: '1px solid rgba(34,197,94,0.28)',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
        boxShadow: '0 0 6px rgba(34,197,94,0.8)',
        animation: 'blink 2s ease-in-out infinite',
      }} />
      <span style={{ ...MONO, fontSize: 9, color: '#22c55e', letterSpacing: '0.1em' }}>SCOPE LIVE</span>
      <button onClick={onStop} title="Disconnect" style={{
        display: 'flex', alignItems: 'center',
        background: 'none', border: 'none', padding: 1,
        color: 'rgba(34,197,94,0.45)', cursor: 'pointer',
      }}>
        <X size={10} />
      </button>
    </div>
  )
}

export function ScopePreview() {
  const { status, statusMessage, videoRef, startStream, stopStream } = useScopeWebRTC()
  const [dismissed, setDismissed] = useState(false)

  React.useEffect(() => { setDismissed(false) }, [status])

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* Live video fades in over canvas when ready */}
      <video ref={videoRef} autoPlay muted playsInline style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover',
        opacity: status === 'ready' ? 1 : 0,
        transition: 'opacity 0.7s ease',
        pointerEvents: 'none',
      }} />

      {/* UI overlays — re-enable pointer events only for the chips */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>

        {/* Scope connection is managed in the Controls tab — no chip here when disconnected */}

        {(status === 'connecting' || status === 'loading') && (
          <div style={{ pointerEvents: 'auto' }}>
            <LoadingBanner message={statusMessage} onCancel={stopStream} />
          </div>
        )}

        {status === 'ready' && (
          <div style={{ pointerEvents: 'auto' }}>
            <LiveChip onStop={stopStream} />
          </div>
        )}
      </div>
    </div>
  )
}
