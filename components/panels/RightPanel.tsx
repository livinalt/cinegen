'use client'

/**
 * RightPanel v12:
 * - Tabs: Motion only (FX is a mini dropdown button in the header)
 * - Motion tab: compact sliders + Freeze/Random/Reset actions
 * - FX: mini button in header, opens dropdown
 * - Lyrics: collapsible section below the tabs (not a tab)
 * - Canvas tab removed entirely
 */

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import { Slider } from '@/components/ui/Slider'
import { Info, Layers, ChevronDown, ChevronUp, ArrowUp, AlignCenter, ArrowDown, Plus, X } from 'lucide-react'
import { useCallback } from 'react'

const MONO: React.CSSProperties = { fontFamily: 'DM Mono, monospace' }
const SANS: React.CSSProperties = { fontFamily: 'Plus Jakarta Sans, sans-serif' }

function Tip({ text }: { text: string }) {
  const [v, setV] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}>
      <Info size={9} style={{ color: 'var(--text-tertiary)', cursor: 'help', flexShrink: 0 }} />
      {v && (
        <span style={{
          position: 'absolute', left: '120%', top: '50%', transform: 'translateY(-50%)',
          background: '#0f1011', color: 'rgba(255,255,255,0.85)',
          padding: '5px 9px', borderRadius: 6, fontSize: 10.5, lineHeight: 1.5,
          whiteSpace: 'nowrap', zIndex: 200, pointerEvents: 'none',
          boxShadow: '0 4px 20px rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
        }}>{text}</span>
      )}
    </span>
  )
}

// ─── FX Dropdown ──────────────────────────────────────────────────────────────
function FXDropdown() {
  const { state, setParam } = useApp()
  const { params } = state
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn)
  }, [open])

  const fxKeys: Array<{ key: 'fxGlow'|'fxVignette'|'fxGrain'|'fxBlur'|'fxFlicker'|'fxTrails'; label: string }> = [
    { key: 'fxVignette', label: 'Vignette' },
    { key: 'fxGlow',     label: 'Glow' },
    { key: 'fxGrain',    label: 'Film grain' },
    { key: 'fxBlur',     label: 'Soft blur' },
    { key: 'fxFlicker',  label: 'Flicker' },
    { key: 'fxTrails',   label: 'Trails' },
  ]
  const activeCount = fxKeys.filter(f => params[f.key]).length

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="FX" style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 9px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s',
        background: activeCount > 0 ? 'var(--accent-muted)' : 'var(--raised-bg)',
        border: `1px solid ${activeCount > 0 ? 'var(--accent-border)' : 'var(--border-default)'}`,
        color: activeCount > 0 ? 'var(--accent)' : 'var(--text-tertiary)',
        fontSize: 10.5, fontWeight: 600, ...SANS,
      }}>
        <Layers size={10} />
        FX
        {activeCount > 0 && (
          <span style={{ ...MONO, fontSize: 8, background: 'var(--accent)', color: '#fff', borderRadius: 99, padding: '0px 4px', fontWeight: 700 }}>{activeCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 200,
          width: 160, background: '#0f1011', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
          padding: '5px',
        }}>
          {fxKeys.map(({ key, label }) => (
            <button key={key} onClick={() => setParam(key, !params[key])} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '6px 9px', borderRadius: 5, cursor: 'pointer', transition: 'all 0.1s',
              background: params[key] ? 'var(--accent-muted)' : 'transparent',
              border: 'none', color: params[key] ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11.5, textAlign: 'left', ...SANS,
            }}>
              {label}
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: params[key] ? 'var(--accent)' : 'var(--border-strong)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Motion Tab (compact — also has canvas actions) ───────────────────────────
function MotionTab() {
  const { state, setParam, dispatch } = useApp()
  const { params } = state
  const sliders = [
    { key: 'motionSpeed' as const,       label: 'Motion speed',  tip: 'How fast the background evolves' },
    { key: 'transformStrength' as const,  label: 'AI strength',   tip: 'How tightly AI follows your prompt' },
    { key: 'atmosphere' as const,         label: 'Atmosphere',    tip: 'Haze, fog and ambient light density' },
    { key: 'brightness' as const,         label: 'Brightness',    tip: '0.5–0.7 for stage projection' },
    { key: 'smoothness' as const,         label: 'Smoothness',    tip: 'Frame-to-frame transition softness' },
  ]
  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 13 }}>
      {/* Sliders — compact */}
      {sliders.map(({ key, label, tip }) => (
        <div key={key}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', ...SANS }}>{label}</span>
              <Tip text={tip} />
            </div>
            <span style={{ ...MONO, fontSize: 9.5, color: 'var(--accent)', background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', borderRadius: 4, padding: '1px 5px', minWidth: 30, textAlign: 'center' }}>
              {(params[key] as number).toFixed(2)}
            </span>
          </div>
          <Slider value={params[key] as number} onChange={v => setParam(key, v)} />
        </div>
      ))}

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 -12px' }} />

      {/* Canvas quick-actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        {[
          { label: params.freeze ? 'Unfreeze' : 'Freeze', key: 'F', active: params.freeze, action: () => dispatch({ type: 'TOGGLE_FREEZE' }) },
          { label: 'Random',  key: 'R', active: false, action: () => dispatch({ type: 'RANDOMIZE' }) },
          { label: 'Reset',   key: '⎋', active: false, action: () => dispatch({ type: 'RESET_TO_PRESET' }) },
        ].map(({ label, key, active, action }) => (
          <button key={label} onClick={action} style={{
            padding: '5px 4px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.12s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            background: active ? 'var(--accent-muted)' : 'var(--raised-bg)',
            border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border-default)'}`,
            color: active ? 'var(--accent)' : 'var(--text-secondary)',
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 500, ...SANS }}>{label}</span>
            <kbd style={{ ...MONO, fontSize: 8, color: 'var(--text-disabled)', background: 'none', border: 'none', padding: 0 }}>{key}</kbd>
          </button>
        ))}
      </div>

      {/* Output routing — ultra compact */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderRadius: 7, border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {[
          { key: 'virtualCameraEnabled' as const, label: 'Virtual camera', sub: 'CINEGEN-1' },
          { key: 'ndiEnabled' as const,            label: 'NDI output',     sub: params.ndiEnabled ? 'Active' : 'Off' },
        ].map(({ key, label, sub }, i) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', background: i % 2 === 0 ? 'var(--raised-bg)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', ...SANS }}>{label}</span>
              <span style={{ ...MONO, fontSize: 8.5, color: 'var(--text-tertiary)' }}>{sub}</span>
            </div>
            <button onClick={() => dispatch({ type: 'SET_PARAM', key, value: !params[key] })} style={{
              ...MONO, fontSize: 8.5, padding: '2px 7px', borderRadius: 99, cursor: 'pointer', fontWeight: 600,
              background: params[key] ? 'var(--accent-muted)' : 'transparent',
              border: `1px solid ${params[key] ? 'var(--accent-border)' : 'var(--border-default)'}`,
              color: params[key] ? 'var(--accent)' : 'var(--text-tertiary)',
            }}>
              {params[key] ? 'On' : 'Off'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Lyrics Collapsible Panel ─────────────────────────────────────────────────
function LyricsPanel() {
  const { state, dispatch } = useApp()
  const { lyricsLines, activeLyricIndex, lyricsPosition } = state
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(lyricsLines.join('\n'))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = queueRef.current?.querySelector('[data-active="true"]') as HTMLElement
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeLyricIndex])

  const parseLrc = (c: string) => c.split('\n').map(l => l.replace(/\[[\d:.]+\]/g, '').trim()).filter(l => l.length > 0 && !l.startsWith('['))
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const content = e.target?.result as string
      const lines = file.name.endsWith('.lrc') ? parseLrc(content) : content.split('\n').filter(l => l.trim())
      if (!lines.length) return
      setText(lines.join('\n')); dispatch({ type: 'SET_LYRICS', lines })
    }
    reader.readAsText(file)
  }, [dispatch])

  const pos = lyricsPosition || 'bottom'
  const posOpts = [
    { v: 'top' as const, I: ArrowUp, label: 'Top' },
    { v: 'center' as const, I: AlignCenter, label: 'Mid' },
    { v: 'bottom' as const, I: ArrowDown, label: 'Btm' },
  ]

  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
      {/* Collapse header */}
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-secondary)', transition: 'background 0.12s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)', ...SANS }}>Lyrics</span>
          {lyricsLines.length > 0 && (
            <span style={{ ...MONO, fontSize: 8.5, background: 'var(--accent-muted)', color: 'var(--accent)', borderRadius: 99, padding: '1px 6px', border: '1px solid var(--accent-border)' }}>
              {activeLyricIndex + 1}/{lyricsLines.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
          {/* Overlay toggle + position */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => dispatch({ type: 'SET_PARAM', key: 'lyricsEnabled', value: !state.params.lyricsEnabled })} style={{
              ...MONO, fontSize: 8.5, padding: '2px 8px', borderRadius: 99, cursor: 'pointer', fontWeight: 600,
              background: state.params.lyricsEnabled ? 'var(--accent-muted)' : 'var(--raised-bg)',
              border: `1px solid ${state.params.lyricsEnabled ? 'var(--accent-border)' : 'var(--border-default)'}`,
              color: state.params.lyricsEnabled ? 'var(--accent)' : 'var(--text-secondary)', flexShrink: 0,
            }}>{state.params.lyricsEnabled ? '● Visible' : '○ Hidden'}</button>
            <div style={{ display: 'flex', gap: 3, flex: 1 }}>
              {posOpts.map(({ v, I, label }) => (
                <button key={v} onClick={() => dispatch({ type: 'SET_LYRICS_POSITION', position: v })} title={label} style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '4px 0', borderRadius: 5, cursor: 'pointer',
                  background: pos === v ? 'var(--accent-muted)' : 'var(--raised-bg)',
                  border: `1px solid ${pos === v ? 'var(--accent-border)' : 'var(--border-default)'}`,
                  color: pos === v ? 'var(--accent)' : 'var(--text-tertiary)',
                }}><I size={10} /></button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ ...MONO, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Text</span>
              <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '2px 6px', borderRadius: 4, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer' }}>
                <Plus size={8} /> Import
              </button>
            </div>
            <textarea rows={3} value={text} onChange={e => setText(e.target.value)}
              placeholder="One line per row…"
              style={{ width: '100%', padding: '6px 8px', borderRadius: 5, resize: 'none', height: 60, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 10.5, lineHeight: 1.6, outline: 'none', ...SANS }}
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent-border)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-default)'} />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
              <button onClick={() => { const lines = text.split('\n').filter(l => l.trim()); if (lines.length) dispatch({ type: 'SET_LYRICS', lines }) }} style={{ flex: 1, padding: '4px', borderRadius: 4, fontSize: 10.5, fontWeight: 600, background: 'var(--accent-muted)', border: '1px solid var(--accent-border)', color: 'var(--accent)', cursor: 'pointer' }}>Load</button>
              <button onClick={() => { setText(''); dispatch({ type: 'SET_LYRICS', lines: [] }) }} style={{ flex: 1, padding: '4px', borderRadius: 4, fontSize: 10.5, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Clear</button>
            </div>
          </div>

          {/* Queue */}
          {lyricsLines.length > 0 && (
            <>
              <div ref={queueRef} style={{ overflowY: 'auto', maxHeight: 110, scrollbarWidth: 'none', borderRadius: 5, border: '1px solid var(--border-subtle)', background: 'var(--sunken-bg)' }}>
                {lyricsLines.map((line, i) => (
                  <div key={i} data-active={i === activeLyricIndex ? 'true' : 'false'}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_LYRIC', index: i })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', cursor: 'pointer',
                      background: i === activeLyricIndex ? 'var(--accent-muted)' : 'transparent',
                      borderLeft: `2px solid ${i === activeLyricIndex ? 'var(--accent)' : 'transparent'}` }}>
                    <span style={{ ...MONO, fontSize: 8, color: 'var(--text-tertiary)', width: 11, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: i === activeLyricIndex ? 'var(--accent)' : 'var(--text-secondary)', fontWeight: i === activeLyricIndex ? 500 : 400 }}>{line}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={() => dispatch({ type: 'PREV_LYRIC' })} disabled={activeLyricIndex === 0} style={{ flex: 1, padding: '3px', borderRadius: 4, fontSize: 10.5, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: activeLyricIndex === 0 ? 'var(--text-disabled)' : 'var(--text-secondary)', cursor: activeLyricIndex === 0 ? 'not-allowed' : 'pointer', opacity: activeLyricIndex === 0 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ ...MONO, fontSize: 9, color: 'var(--text-tertiary)', minWidth: 34, textAlign: 'center' }}>{activeLyricIndex + 1}/{lyricsLines.length}</span>
                <button onClick={() => dispatch({ type: 'NEXT_LYRIC' })} disabled={activeLyricIndex === lyricsLines.length - 1} style={{ flex: 1, padding: '3px', borderRadius: 4, fontSize: 10.5, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: activeLyricIndex === lyricsLines.length-1 ? 'var(--text-disabled)' : 'var(--text-secondary)', cursor: activeLyricIndex === lyricsLines.length-1 ? 'not-allowed' : 'pointer', opacity: activeLyricIndex === lyricsLines.length-1 ? 0.4 : 1 }}>Next →</button>
              </div>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".txt,.lrc" style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
        </div>
      )}
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────
export function RightPanel() {
  return (
    <aside className="panel-card" style={{ width: 232, flexShrink: 0 }}>
      {/* Header with FX mini button */}
      <div className="panel-header" style={{ padding: '10px 12px 8px' }}>
        <span className="panel-title" style={{ fontSize: 12 }}>Controls</span>
        <FXDropdown />
      </div>

      {/* Motion tab content — fills remaining space */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <MotionTab />
      </div>

      {/* Lyrics — collapsible panel at the bottom */}
      <LyricsPanel />
    </aside>
  )
}
