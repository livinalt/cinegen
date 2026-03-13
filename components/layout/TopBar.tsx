'use client'

/**
 * TopBar v12:
 * - No FPS display
 * - Scope GPU pill with better connect/disconnect buttons
 * - Export → icon button on far right (⬇ icon)
 * - Lyrics & Audio pill (centre)
 * - Blackout icon button on right
 */

import { useApp } from '@/context/AppContext'
import { useScope } from '@/context/ScopeContext'
import {
  Settings, WifiOff, Loader2, Download, Square,
  X, Eye, EyeOff
} from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'

const MONO: React.CSSProperties = { fontFamily: 'DM Mono, monospace' }
const SANS: React.CSSProperties = { fontFamily: 'Plus Jakarta Sans, sans-serif' }

// ─── Top Toast (Vercel-dark style) ────────────────────────────────────────────
function TopToast({ msg, type, onDismiss }: { msg: string; type: 'error'|'warn'|'success'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 4500); return () => clearTimeout(t) }, [msg])
  // Vercel-style: near-black bg, subtle colored border, muted text
  const s = {
    error:   { bg: '#1a0f0f', border: 'rgba(229,72,77,0.35)',  color: '#e5484d' },
    warn:    { bg: '#120f08', border: 'rgba(217,119,6,0.3)',   color: '#d97706' },
    success: { bg: '#0a130e', border: 'rgba(62,207,142,0.28)', color: '#3ecf8e' },
  }[type]
  return (
    <div style={{
      position: 'fixed', top: 62, left: '50%', transform: 'translateX(-50%)',
      zIndex: 999, display: 'flex', alignItems: 'center', gap: 9,
      padding: '7px 14px 7px 12px',
      borderRadius: 8, background: s.bg,
      border: `1px solid ${s.border}`,
      boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.5)',
      animation: 'slideDownFade 0.18s ease',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      <span style={{ ...MONO, fontSize: 11, color: s.color, letterSpacing: '0.01em' }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: s.color, opacity: 0.45, cursor: 'pointer', padding: '0 0 0 4px', display: 'flex', flexShrink: 0 }}><X size={10} /></button>
    </div>
  )
}

// ─── GPU Indicator (compact single button with dot) ───────────────────────────
function GpuIndicator({ onToast }: { onToast: (msg: string, type: 'error'|'warn'|'success') => void }) {
  const { status, statusMessage, startStream, stopStream } = useScope()
  const prevStatus = useRef(status)

  useEffect(() => {
    if (prevStatus.current !== 'error' && status === 'error') {
      onToast('Scope connection failed — check the Server URL in Scope Settings → General and update SCOPE_URL in .env.local', 'error')
    }
    prevStatus.current = status
  }, [status])

  const isConnecting = status === 'connecting' || status === 'loading' || status === 'creating'
  const isReady = status === 'ready'
  const isError = status === 'error'

  const dotColor = isReady ? 'var(--live-color)' : isError ? 'var(--error-color)' : 'var(--text-disabled)'

  return (
    <button
      title={isReady ? 'GPU live — click to disconnect' : isConnecting ? statusMessage : isError ? 'GPU error — click to retry' : 'Connect GPU'}
      onClick={() => (isReady || isConnecting) ? stopStream() : startStream()}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
        background: isReady ? 'rgba(62,207,142,0.07)' : isError ? 'rgba(229,72,77,0.07)' : 'var(--raised-bg)',
        border: `1px solid ${isReady ? 'rgba(62,207,142,0.2)' : isError ? 'rgba(229,72,77,0.2)' : 'var(--border-default)'}`,
      }}>
      {isConnecting
        ? <Loader2 size={10} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
        : <span style={{
            width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
            background: dotColor,
            boxShadow: isReady ? '0 0 0 2px rgba(62,207,142,0.2)' : 'none',
            animation: isReady ? 'pulse 2.5s ease-in-out infinite' : 'none',
            transition: 'all 0.2s',
          }} />
      }
      <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, letterSpacing: '0.04em', color: isReady ? 'var(--live-color)' : isError ? 'var(--error-color)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
        GPU
      </span>
    </button>
  )
}

// ─── Scope GPU Pill (kept for reference, replaced by GpuIndicator) ────────────
function ScopeGPUPill({ onToast }: { onToast: (msg: string, type: 'error'|'warn'|'success') => void }) {
  const { status, statusMessage, startStream, stopStream } = useScope()
  const prevStatus = useRef(status)

  useEffect(() => {
    if (prevStatus.current !== 'error' && status === 'error') {
      onToast('Scope connection failed — check the Server URL in Scope Settings → General and update SCOPE_URL in .env.local', 'error')
    }
    prevStatus.current = status
  }, [status])

  const isConnecting = status === 'connecting' || status === 'loading' || status === 'creating'
  const isReady = status === 'ready'
  const isError = status === 'error'

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {/* Status indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '5px 10px 5px 10px',
        borderRadius: isReady || isConnecting ? '8px 0 0 8px' : 8,
        background: isReady ? 'rgba(62,207,142,0.08)' : isError ? 'rgba(229,72,77,0.07)' : 'var(--raised-bg)',
        border: `1px solid ${isReady ? 'rgba(62,207,142,0.2)' : isError ? 'rgba(229,72,77,0.2)' : 'var(--border-default)'}`,
        borderRight: (isReady || isConnecting) ? 'none' : undefined,
        transition: 'all 0.18s',
      }}>
        {isConnecting
          ? <Loader2 size={11} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          : isReady
            ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--live-color)', boxShadow: '0 0 0 2px rgba(62,207,142,0.2)', animation: 'pulse 2.5s ease-in-out infinite', flexShrink: 0 }} />
            : <WifiOff size={11} style={{ color: isError ? 'var(--error-color)' : 'var(--text-tertiary)', flexShrink: 0 }} />
        }
        <span style={{ ...SANS, fontSize: 11, fontWeight: 600, color: isReady ? 'var(--live-color)' : isError ? 'var(--error-color)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
          {isReady ? 'GPU live' : isConnecting ? 'Connecting' : isError ? 'GPU error' : 'GPU'}
        </span>
      </div>

      {/* Action button — only when there's an action to take */}
      {!isConnecting && (
        <button
          onClick={() => isReady ? stopStream() : startStream()}
          style={{
            padding: '5px 11px',
            borderRadius: isReady ? '0 8px 8px 0' : 8,
            border: `1px solid ${isReady ? 'rgba(62,207,142,0.2)' : 'var(--border-default)'}`,
            borderLeft: isReady ? '1px solid rgba(62,207,142,0.12)' : '1px solid var(--border-default)',
            cursor: 'pointer', transition: 'all 0.15s',
            fontSize: 11, fontWeight: 600, ...SANS,
            // Gradient for "Connect" to give it life
            background: isReady
              ? 'rgba(229,72,77,0.07)'
              : 'linear-gradient(135deg, rgba(108,142,247,0.18) 0%, rgba(108,142,247,0.08) 100%)',
            color: isReady ? 'var(--error-color)' : 'var(--accent)',
            boxShadow: isReady ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = isReady
              ? 'rgba(229,72,77,0.14)'
              : 'linear-gradient(135deg, rgba(108,142,247,0.28) 0%, rgba(108,142,247,0.14) 100%)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = isReady
              ? 'rgba(229,72,77,0.07)'
              : 'linear-gradient(135deg, rgba(108,142,247,0.18) 0%, rgba(108,142,247,0.08) 100%)'
          }}
        >
          {isReady ? 'Disconnect' : 'Connect'}
        </button>
      )}
      {isConnecting && (
        <button onClick={stopStream} style={{
          padding: '5px 10px', borderRadius: '0 8px 8px 0',
          border: '1px solid var(--border-default)', borderLeft: '1px solid rgba(255,255,255,0.04)',
          cursor: 'pointer', background: 'var(--raised-bg)', color: 'var(--text-tertiary)',
          fontSize: 11, ...SANS,
        }}>
          Cancel
        </button>
      )}
    </div>
  )
}

// ─── Export Icon Button + Popover ─────────────────────────────────────────────
function ExportButton({ canvasRef, onToast }: {
  canvasRef?: React.RefObject<HTMLCanvasElement>
  onToast: (msg: string, type: 'error'|'warn'|'success') => void
}) {
  const { state, dispatch, isProFeature } = useApp()
  const { exportDuration, exportResolution, audioFileUrl, audioEnabled, audioVolume } = state
  const isPro = isProFeature('export')
  const [open, setOpen] = useState(false)

  type RecState = 'idle' | 'recording' | 'ready'
  const [recState, setRecState] = useState<RecState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [progress, setProgress] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [blob, setBlob] = useState<Blob | null>(null)
  const [mime, setMime] = useState('video/webm')

  const recRef  = useRef<MediaRecorder | null>(null)
  const chunks  = useRef<Blob[]>([])
  const tick    = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoEnd = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioCtx = useRef<AudioContext | null>(null)
  const audioEl  = useRef<HTMLAudioElement | null>(null)
  const popRef   = useRef<HTMLDivElement>(null)

  const isUnlimited = exportDuration === null
  const fps = isPro ? 30 : 15

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => { if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const clearTimers = () => {
    if (tick.current) { clearInterval(tick.current); tick.current = null }
    if (autoEnd.current) { clearTimeout(autoEnd.current); autoEnd.current = null }
  }
  const stopAudio = () => { audioEl.current?.pause(); audioCtx.current?.close().catch(() => {}); audioEl.current = null; audioCtx.current = null }

  const handleRecord = () => {
    const canvas = canvasRef?.current
    if (!canvas || canvas.width === 0) { onToast('Preview not ready', 'error'); return }
    const mimeType = ['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } }) || 'video/webm'
    chunks.current = []; setBlob(null); setProgress(0); setElapsed(0)
    setCountdown(isUnlimited ? 0 : (exportDuration ?? 30))
    setMime(mimeType); setRecState('recording')
    let stream: MediaStream
    try { stream = (canvas as any).captureStream(fps) }
    catch { onToast('captureStream not supported — use Chrome', 'error'); setRecState('idle'); return }
    if (audioFileUrl && audioEnabled) {
      try {
        const ctx = new AudioContext(); audioCtx.current = ctx
        const dest = ctx.createMediaStreamDestination()
        const el = new Audio(audioFileUrl); el.loop = true; el.volume = audioVolume; audioEl.current = el
        const src = ctx.createMediaElementSource(el); const gain = ctx.createGain(); gain.gain.value = audioVolume
        src.connect(gain); gain.connect(dest); gain.connect(ctx.destination); el.play().catch(() => {})
        stream = new MediaStream([...stream.getVideoTracks(), ...dest.stream.getAudioTracks()])
      } catch { onToast('Audio mix failed — video only', 'warn') }
    }
    const rec = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: exportResolution === '4K' ? 16_000_000 : 6_000_000 })
    recRef.current = rec
    rec.ondataavailable = (e: BlobEvent) => { if (e.data?.size > 0) chunks.current.push(e.data) }
    rec.onstop = () => {
      clearTimers(); stopAudio()
      setTimeout(() => {
        const b = new Blob(chunks.current, { type: mimeType })
        if (b.size === 0) { onToast('Recording was empty', 'error'); setRecState('idle'); return }
        setBlob(b); setProgress(100); setRecState('ready')
        onToast(`Clip ready · ${(b.size/1024/1024).toFixed(1)} MB`, 'success')
      }, 100)
    }
    rec.onerror = () => { clearTimers(); stopAudio(); setRecState('idle'); onToast('Recording failed', 'error') }
    rec.start(250)
    const startMs = Date.now()
    if (isUnlimited) {
      tick.current = setInterval(() => setElapsed(Math.floor((Date.now()-startMs)/1000)), 500)
    } else {
      const total = (exportDuration ?? 30) * 1000
      tick.current = setInterval(() => {
        const el = Date.now() - startMs
        setProgress(Math.min(97, (el/total)*100))
        setCountdown(Math.max(0, Math.ceil((total-el)/1000)))
      }, 200)
      autoEnd.current = setTimeout(() => { clearTimers(); if (recRef.current?.state === 'recording') recRef.current.stop() }, total)
    }
  }
  const handleStop = () => { clearTimers(); if (recRef.current?.state === 'recording') recRef.current.stop() }
  const handleDownload = () => {
    if (!blob) return
    const ext = mime.includes('mp4') ? 'mp4' : 'webm'
    const label = isUnlimited ? `${elapsed}s` : `${exportDuration}s`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `cinegen-${label}-${exportResolution}.${ext}`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    onToast(`Saved ${label} · ${exportResolution}`, 'success')
    setTimeout(() => { setRecState('idle'); setBlob(null); setProgress(0) }, 500)
  }

  const recIsActive = recState === 'recording'

  return (
    <div ref={popRef} style={{ position: 'relative' }}>
      {/* Icon button */}
      <button onClick={() => setOpen(o => !o)} title="Export / Record" style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
        background: recIsActive ? 'rgba(229,72,77,0.1)' : recState === 'ready' ? 'rgba(62,207,142,0.08)' : 'var(--raised-bg)',
        border: `1px solid ${recIsActive ? 'rgba(229,72,77,0.28)' : recState === 'ready' ? 'rgba(62,207,142,0.22)' : 'var(--border-default)'}`,
        color: recIsActive ? 'var(--error-color)' : recState === 'ready' ? 'var(--live-color)' : 'var(--text-secondary)',
        position: 'relative',
      }}>
        {recIsActive
          ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error-color)', animation: 'pulse 1s ease-in-out infinite' }} />
          : <Download size={14} />
        }
        {/* Countdown badge */}
        {recIsActive && !isUnlimited && (
          <span style={{ ...MONO, position: 'absolute', top: -6, right: -6, fontSize: 8, background: 'var(--error-color)', color: '#fff', borderRadius: 99, padding: '1px 4px', fontWeight: 700 }}>
            {countdown}s
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 200,
          width: 200, borderRadius: 10,
          background: '#0f1011', border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
          padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div>
            <p style={{ ...MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Duration</p>
            <div style={{ display: 'flex', gap: 3 }}>
              {(isPro ? [15,30,60,null] as const : [15,30,60] as const).map(d => (
                <button key={String(d)} disabled={recIsActive}
                  onClick={() => dispatch({ type: 'SET_EXPORT_DURATION', duration: d })}
                  style={{ ...MONO, flex: 1, fontSize: 10, padding: '4px 0', borderRadius: 5, cursor: recIsActive ? 'not-allowed' : 'pointer',
                    border: `1px solid ${exportDuration === d ? 'var(--accent-border)' : 'var(--border-default)'}`,
                    background: exportDuration === d ? 'var(--accent-muted)' : 'var(--raised-bg)',
                    color: exportDuration === d ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {d === null ? '∞' : `${d}s`}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ ...MONO, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 6 }}>Resolution</p>
            <div style={{ display: 'flex', gap: 3 }}>
              {(['1080p','4K'] as const).map(r => (
                <button key={r} disabled={recIsActive}
                  onClick={() => dispatch({ type: 'SET_EXPORT_RESOLUTION', resolution: r })}
                  style={{ ...MONO, flex: 1, fontSize: 10, padding: '4px 0', borderRadius: 5, cursor: recIsActive ? 'not-allowed' : 'pointer',
                    border: `1px solid ${exportResolution === r ? 'var(--accent-border)' : 'var(--border-default)'}`,
                    background: exportResolution === r ? 'var(--accent-muted)' : 'var(--raised-bg)',
                    color: exportResolution === r ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {recIsActive && !isUnlimited && (
            <div style={{ height: 2, borderRadius: 2, background: 'var(--raised-bg)', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--error-color)', borderRadius: 2, width: `${progress}%`, transition: 'width 0.2s' }} />
            </div>
          )}
          {recState === 'idle' && (
            <button onClick={handleRecord} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12, background: 'var(--error-muted)', color: 'var(--error-color)', border: '1px solid var(--error-border)', ...SANS }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--error-color)' }} /> Record
            </button>
          )}
          {recState === 'recording' && (
            <button onClick={handleStop} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12, background: 'var(--error-muted)', color: 'var(--error-color)', border: '1px solid var(--error-border)', ...SANS }}>
              <Square size={10} fill="var(--error-color)" /> Stop
            </button>
          )}
          {recState === 'ready' && blob && (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 12, background: 'var(--live-muted)', color: 'var(--live-color)', border: '1px solid var(--live-border)', ...SANS }}>
                <Download size={11} /> Save
              </button>
              <button onClick={() => { setRecState('idle'); setBlob(null); setProgress(0) }} style={{ padding: '8px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 12, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>New</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export function TopBar({ onSettingsOpen, canvasRef }: {
  onSettingsOpen?: () => void
  canvasRef?: React.RefObject<HTMLCanvasElement>
}) {
  const { state, dispatch } = useApp()
  const { params, tier } = state
  const [toast, setToast] = useState<{ msg: string; type: 'error'|'warn'|'success' } | null>(null)

  const showToast = (msg: string, type: 'error'|'warn'|'success') => setToast({ msg, type })

  return (
    <>
      {toast && <TopToast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

      <header className="topbar">
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 14, height: 16, borderRadius: 4, border: '2px solid var(--accent)', opacity: 0.9 }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 16, borderRadius: 4, border: '2px solid var(--accent)', opacity: 0.3 }} />
          </div>
          <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>CineGen</span>
        </div>

        {/* Mode */}
        <div style={{ display: 'flex', gap: 2, padding: 3, borderRadius: 7, background: 'var(--sunken-bg)', border: '1px solid var(--border-subtle)', marginLeft: 14 }}>
          {(['generate','transform'] as const).map(m => (
            <button key={m} onClick={() => dispatch({ type: 'SET_MODE', mode: m })} style={{
              padding: '4px 12px', borderRadius: 5, fontSize: 11, fontWeight: params.mode === m ? 700 : 500,
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              background: params.mode === m ? 'var(--raised-bg)' : 'transparent',
              color: params.mode === m ? 'var(--text-primary)' : 'var(--text-tertiary)',
              border: params.mode === m ? '1px solid var(--border-default)' : '1px solid transparent',
              boxShadow: params.mode === m ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              cursor: 'pointer', transition: 'all 0.15s', textTransform: 'capitalize',
            }}>{m}</button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Centre: VirtualCam + NDI status indicators — always visible, read-only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* VirtualCam indicator */}
          <div title="Virtual Camera" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 7,
            background: params.virtualCameraEnabled ? 'rgba(62,207,142,0.07)' : 'var(--raised-bg)',
            border: `1px solid ${params.virtualCameraEnabled ? 'rgba(62,207,142,0.18)' : 'var(--border-default)'}`,
            transition: 'all 0.2s',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: params.virtualCameraEnabled ? 'var(--live-color)' : 'var(--text-disabled)',
              boxShadow: params.virtualCameraEnabled ? '0 0 0 2px rgba(62,207,142,0.2)' : 'none',
              animation: params.virtualCameraEnabled ? 'pulse 2.5s ease-in-out infinite' : 'none',
              transition: 'all 0.2s',
            }} />
            <span style={{ ...MONO, fontSize: 10, color: params.virtualCameraEnabled ? 'var(--live-color)' : 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
              CAM
            </span>
          </div>

          {/* NDI indicator */}
          <div title="NDI Output" style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 7,
            background: params.ndiEnabled ? 'rgba(62,207,142,0.07)' : 'var(--raised-bg)',
            border: `1px solid ${params.ndiEnabled ? 'rgba(62,207,142,0.18)' : 'var(--border-default)'}`,
            transition: 'all 0.2s',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: params.ndiEnabled ? 'var(--live-color)' : 'var(--text-disabled)',
              boxShadow: params.ndiEnabled ? '0 0 0 2px rgba(62,207,142,0.2)' : 'none',
              animation: params.ndiEnabled ? 'pulse 2.5s ease-in-out infinite' : 'none',
              transition: 'all 0.2s',
            }} />
            <span style={{ ...MONO, fontSize: 10, color: params.ndiEnabled ? 'var(--live-color)' : 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
              NDI
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Right side: GPU · Blackout · Export · Pro badge · Settings · Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* GPU — single pill with status dot, sits right before Blackout */}
          <GpuIndicator onToast={showToast} />

          {/* thin divider */}
          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', flexShrink: 0 }} />

          {/* Blackout toggle */}
          <button
            title={params.blackout ? 'Restore output' : 'Blackout output'}
            onClick={() => dispatch({ type: 'TOGGLE_BLACKOUT' })}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              background: params.blackout ? 'rgba(255,255,255,0.09)' : 'var(--raised-bg)',
              border: `1px solid ${params.blackout ? 'var(--border-strong)' : 'var(--border-default)'}`,
              color: params.blackout ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}>
            {params.blackout ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>

          {/* thin divider */}
          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)', flexShrink: 0 }} />

          {/* Export icon button */}
          <ExportButton canvasRef={canvasRef} onToast={showToast} />

          <span
            className={tier === 'pro' ? 'badge badge-pro' : 'badge'}
            style={tier !== 'pro' ? { background: 'var(--raised-bg)', color: 'var(--text-tertiary)', border: '1px solid var(--border-default)' } : {}}>
            {tier === 'pro' ? '✦ Pro' : 'Free'}
          </span>

          <button onClick={onSettingsOpen} className="btn-icon" aria-label="Settings" style={{ color: 'var(--text-secondary)' }}>
            <Settings size={14} />
          </button>

          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 10, color: 'var(--accent)' }}>JD</span>
          </div>
        </div>
      </header>
    </>
  )
}
