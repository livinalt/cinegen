'use client'

/**
 * BottomBar v12:
 * - "Prompt" label sits ABOVE the textarea
 * - AI button is a small icon button (✦ sparkle) to the right
 * - Prompt apply feedback: inline border flash (green = applied, amber = dirty, red = error)
 *   No toast — non-interrupting
 * - Darker Vercel-style toast for external messages
 */

import React, { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { AlertTriangle, CheckCircle, Sparkles, Loader2, X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { getPresetById } from '@/lib/presets'

export interface BottomBarProps {
  externalPrompt?: string | null
  onExternalPromptConsumed?: () => void
  toast?: { msg: string; type: 'warn' | 'error' | 'success' } | null
  onDismissToast?: () => void
}

const MONO: React.CSSProperties = { fontFamily: 'DM Mono, monospace' }
const SANS: React.CSSProperties = { fontFamily: 'Plus Jakarta Sans, sans-serif' }

// Vercel-dark style toast
function Toast({ msg, type, onDismiss }: { msg: string; type: 'warn'|'error'|'success'; onDismiss: () => void }) {
  useEffect(() => { const t = setTimeout(onDismiss, 6000); return () => clearTimeout(t) }, [msg])
  const s = {
    warn:    { bg: '#120f08', border: 'rgba(217,119,6,0.3)',   color: '#d97706' },
    error:   { bg: '#1a0f0f', border: 'rgba(229,72,77,0.35)',  color: '#e5484d' },
    success: { bg: '#0a130e', border: 'rgba(62,207,142,0.28)', color: '#3ecf8e' },
  }[type]
  return (
    <div style={{
      position: 'absolute', bottom: '100%', left: 0, right: 0, marginBottom: 2,
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
      background: s.bg, borderTop: `1px solid ${s.border}`,
      borderRadius: 'var(--radius-card) var(--radius-card) 0 0',
      animation: 'slideUpFade 0.2s ease',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
      <span style={{ ...MONO, fontSize: 10.5, color: s.color, flex: 1 }}>{msg}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', padding: '2px 4px', cursor: 'pointer', color: s.color, opacity: 0.5 }}>✕</button>
    </div>
  )
}

// ─── AI Prompt Modal ──────────────────────────────────────────────────────────
function AIPromptModal({ open, onClose, onApply, presetId }: {
  open: boolean; onClose: () => void; onApply: (p: string) => void; presetId: string
}) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{ label: string; text: string }[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const preset = getPresetById(presetId)

  useEffect(() => { if (open && !suggestions.length) generate() }, [open])

  const generate = async () => {
    setLoading(true); setSuggestions([]); setSelected(null)
    try {
      const res = await fetch('/api/ai-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          presetName: preset?.name || 'Heavenly',
          presetCategory: preset?.category || 'worship',
        })
      })
      const data = await res.json()
      setSuggestions(data.prompts)
    } catch {
      setSuggestions([
        { label: 'Soft',      text: 'Soft golden light rays streaming through luminous clouds, gentle sacred radiance, ethereal white atmosphere' },
        { label: 'Dramatic',  text: 'Dramatic celestial beams bursting through storm clouds, deep shadows, powerful heavenly light, epic cinematic' },
        { label: 'Abstract',  text: 'Abstract flowing luminous particles, fluid light trails, shimmering golden mist, deep textural sacred energy' },
        { label: 'Cinematic', text: 'Wide cinematic horizon at dawn, golden sky gradients, soft lens flare, majestic open sky, peaceful depth' },
      ])
    } finally { setLoading(false) }
  }

  return (
    <Modal open={open} onClose={() => { onClose(); setSuggestions([]); setSelected(null) }}
      title="AI Prompt" size="md"
      footer={
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <button onClick={generate} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: 11.5, cursor: 'pointer', ...SANS }}>
            {loading ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={11} />} Regenerate
          </button>
          <button onClick={() => { if (selected) { onApply(selected); onClose(); setSuggestions([]); setSelected(null) } }} disabled={!selected}
            style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 6, background: selected ? 'var(--accent)' : 'var(--raised-bg)', color: selected ? '#fff' : 'var(--text-disabled)', border: selected ? 'none' : '1px solid var(--border-default)', fontSize: 11.5, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed', ...SANS }}>
            Use prompt
          </button>
        </div>
      }>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', ...SANS }}>
          Suggestions for <strong style={{ color: 'var(--text-primary)' }}>{preset?.name}</strong>
        </p>
        {loading
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 54, borderRadius: 8, background: 'var(--raised-bg)', animation: 'shimmer 1.5s linear infinite' }} />)}</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map((s, i) => (
                <div key={i} onClick={() => setSelected(s.text)} style={{
                  padding: '9px 11px', borderRadius: 8, cursor: 'pointer', transition: 'all 0.12s', fontSize: 11.5, lineHeight: 1.6,
                  background: selected === s.text ? 'var(--accent-muted)' : 'var(--raised-bg)',
                  border: `1px solid ${selected === s.text ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                  color: selected === s.text ? 'var(--text-primary)' : 'var(--text-secondary)', ...SANS,
                }}>
                  <span style={{ ...MONO, display: 'block', fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, color: selected === s.text ? 'var(--accent)' : 'var(--text-tertiary)' }}>{s.label}</span>
                  {s.text}
                </div>
              ))}
            </div>
        }
      </div>
    </Modal>
  )
}

// ─── BottomBar ────────────────────────────────────────────────────────────────
type PromptState = 'idle' | 'dirty' | 'applied' | 'error'

export function BottomBar({ externalPrompt, onExternalPromptConsumed, toast, onDismissToast }: BottomBarProps) {
  const { state, setParam } = useApp()
  const [val, setVal] = useState(state.params.prompt)
  const [promptState, setPromptState] = useState<PromptState>('idle')
  const [aiOpen, setAiOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { setVal(state.params.prompt) }, [state.params.activePresetId])

  useEffect(() => {
    if (externalPrompt) {
      setVal(externalPrompt)
      setParam('prompt', externalPrompt)
      setPromptState('applied')
      setTimeout(() => setPromptState('idle'), 1800)
      onExternalPromptConsumed?.()
    }
  }, [externalPrompt])

  const apply = () => {
    if (!val.trim()) { setPromptState('error'); setTimeout(() => setPromptState('idle'), 1500); return }
    setParam('prompt', val)
    setPromptState('applied')
    setTimeout(() => setPromptState('idle'), 1800)
  }

  const dirty = val !== state.params.prompt && promptState === 'idle'

  // Border/background driven by prompt state — no toast
  const borderColor = promptState === 'applied' ? 'var(--live-border)'
    : promptState === 'error'   ? 'var(--error-border)'
    : promptState === 'dirty'   ? 'var(--warn-border)'
    : dirty                     ? 'var(--border-default)'
    : 'var(--border-default)'

  const bgColor = promptState === 'applied' ? 'rgba(62,207,142,0.04)'
    : promptState === 'error'   ? 'rgba(229,72,77,0.04)'
    : 'var(--raised-bg)'

  const hintText = promptState === 'applied' ? '✓ applied'
    : promptState === 'error'   ? '✕ empty'
    : dirty                     ? '↵ to apply'
    : ''

  const hintColor = promptState === 'applied' ? 'var(--live-color)'
    : promptState === 'error'   ? 'var(--error-color)'
    : 'var(--warn-color)'

  return (
    <>
      <AIPromptModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onApply={p => { setVal(p); setParam('prompt', p); setPromptState('applied'); setTimeout(() => setPromptState('idle'), 1800) }}
        presetId={state.params.activePresetId}
      />

      <div style={{ position: 'relative', flexShrink: 0 }}>
        {toast && <Toast msg={toast.msg} type={toast.type} onDismiss={onDismissToast || (() => {})} />}

        <div style={{
          padding: '10px 14px 10px',
          background: 'var(--panel-bg)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-card)',
        }}>
          {/* Label row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ ...MONO, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', userSelect: 'none' }}>
              Prompt
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Inline hint */}
              <span style={{ ...MONO, fontSize: 9, color: hintColor, opacity: hintText ? 1 : 0, transition: 'opacity 0.2s' }}>
                {hintText || '—'}
              </span>
              {/* AI icon button */}
              <button
                onClick={() => setAiOpen(true)}
                title="Generate prompt with AI"
                style={{
                  width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  background: 'var(--accent-muted)', border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                }}>
                <Sparkles size={11} />
              </button>
            </div>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={val}
            onChange={e => { setVal(e.target.value); if (promptState !== 'idle') setPromptState('idle') }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); apply() } }}
            onFocus={() => { if (promptState === 'idle' && val !== state.params.prompt) setPromptState('dirty') }}
            onBlur={() => { if (promptState === 'dirty') setPromptState('idle') }}
            placeholder="Describe the visual… ↵ to apply, Shift+↵ for new line"
            rows={2}
            style={{
              width: '100%', padding: '8px 10px',
              borderRadius: 7,
              border: `1px solid ${borderColor}`,
              background: bgColor,
              color: 'var(--text-primary)',
              ...SANS, fontSize: 11, lineHeight: 1.65,
              outline: 'none', resize: 'none',
              transition: 'border-color 0.2s, background 0.2s',
              display: 'block',
            }}
          />
        </div>
      </div>
    </>
  )
}
