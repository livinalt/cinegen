'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Upload, X, Film, Lock, Volume2, Music2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { PRESETS, PRESET_CATEGORIES, getPresetsByCategory } from '@/lib/presets'
import type { PresetCategory } from '@/types'

const MONO: React.CSSProperties = { fontFamily: 'DM Mono, monospace' }
const SANS: React.CSSProperties = { fontFamily: 'Plus Jakarta Sans, sans-serif' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtTime(sec: number) {
  if (!isFinite(sec) || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Preset thumb ─────────────────────────────────────────────────────────────
function PresetThumb({ colors }: { colors: [string, string, string] }) {
  return <div style={{ height: 26, background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]}, ${colors[2]})` }} />
}

// ─── Preset browser ───────────────────────────────────────────────────────────
function PresetBrowser() {
  const { state, dispatch, isProFeature } = useApp()
  const { params, activeCategoryTab } = state
  const presets = getPresetsByCategory(activeCategoryTab)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0 12px 8px' }}>
      {/* Category tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
        {PRESET_CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-tab${activeCategoryTab === cat ? ' active' : ''}`}
            onClick={() => dispatch({ type: 'SET_CATEGORY_TAB', category: cat as PresetCategory })}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1, 4)}
          </button>
        ))}
      </div>
      {/* Grid — scrollbar invisible */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
          {presets.map(preset => {
            const isLocked = preset.tier === 'pro' && !isProFeature('presets')
            const isActive = params.activePresetId === preset.id
            return (
              <div
                key={preset.id}
                className={`preset-card${isActive ? ' selected' : ''}`}
                onClick={() => { if (!isLocked) dispatch({ type: 'SET_PRESET', preset }) }}
                title={isLocked ? 'Upgrade to Pro' : preset.name}
              >
                <div style={{ position: 'relative' }}>
                  <PresetThumb colors={preset.colors} />
                  {isLocked && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }}>
                      <Lock size={9} color="rgba(255,255,255,0.6)" />
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 6px' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 500, color: isActive ? 'var(--accent)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preset.name}
                  </span>
                  {isLocked && <span style={{ fontSize: 8, color: 'var(--text-tertiary)' }}>Pro</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Upload zone (Transform mode) ─────────────────────────────────────────────
function UploadZone() {
  const { state, dispatch } = useApp()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('video/')) return

    const url = URL.createObjectURL(file)

    // Prepare offscreen video + canvas + stream
    const videoEl = document.createElement('video')
    videoEl.src = url
    videoEl.loop = true
    videoEl.muted = true
    videoEl.playsInline = true
    videoEl.crossOrigin = 'anonymous'

    try {
      await videoEl.play()
    } catch (err) {
      console.warn('Could not autoplay video for capture', err)
      // still continue — user can interact later
    }

    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animFrame: number | null = null
    const draw = () => {
      if (videoEl.readyState >= 2) {
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
      }
      animFrame = requestAnimationFrame(draw)
    }
    draw()

    const stream = canvas.captureStream(24)

    dispatch({
      type: 'SET_SOURCE_VIDEO',
      name: file.name,
      url,
      file,
      videoEl,
      canvasEl: canvas,
      stream,
      duration: 0,
    })

    // Cleanup function
    return () => {
      if (animFrame) cancelAnimationFrame(animFrame)
      videoEl.pause()
      videoEl.src = ''
      if (stream) stream.getTracks().forEach(t => t.stop())
      URL.revokeObjectURL(url)
    }
  }, [dispatch])

  useEffect(() => {
    return () => {
      // cleanup previous video if any
    }
  }, [])

  // ── Video preview when loaded ───────────────────────────────────────────────
  if (state.sourceVideoName && state.sourceVideoUrl) {
    return (
      <div style={{ flex: 1, padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Loaded file info + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: 'var(--raised-bg)', border: '1px solid var(--border-default)' }}>
          <Film size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {state.sourceVideoName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>Loaded · Looping</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon"
              title="Replace video"
              style={{ padding: 4 }}
            >
              <Upload size={14} />
            </button>
            <button
              onClick={() => dispatch({ type: 'CLEAR_SOURCE_VIDEO' })}
              className="btn-icon"
              title="Delete video"
              style={{ padding: 4, color: 'var(--error-color)' }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Video preview */}
        <div style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          background: 'var(--raised-bg)',
          border: '1px solid var(--border-default)',
          aspectRatio: '1 / 1',
          maxHeight: 180,
        }}>
          <video
            ref={videoPreviewRef}
            src={state.sourceVideoUrl}
            autoPlay
            loop
            muted
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      </div>
    )
  }

  // ── Empty upload zone ────────────────────────────────────────────────────────
  return (
    <div style={{ flex: 1, padding: '0 12px 8px' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files?.[0]) handleFile(e.target.files[0])
        }}
      />
      <div
        className={`upload-zone${dragOver ? ' drag-over' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
        }}
      >
        <Upload size={18} style={{ color: 'var(--text-tertiary)', marginBottom: 6 }} />
        <p style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-secondary)' }}>Drop your video here</p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 3 }}>or click to browse</p>
        <p style={{ ...MONO, fontSize: 10, color: 'var(--text-disabled)', marginTop: 8 }}>MP4 · MOV · WebM · 500 MB</p>
      </div>
    </div>
  )
}

// ─── Audio Section — pinned at bottom, always visible ─────────────────────────
function AudioSection() {
  const { state, dispatch } = useApp()
  const { audioFileName, audioFileUrl, audioEnabled, audioVolume } = state

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)

  // Keep audio element volume in sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = audioVolume
  }, [audioVolume])

  const loadFile = (file: File) => {
    setError('')
    if (!/\.(mp3|wav|ogg|aac|m4a)$/i.test(file.name) && !file.type.startsWith('audio/')) {
      setError('Unsupported format')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('Max 50 MB')
      return
    }
    if (audioFileUrl) URL.revokeObjectURL(audioFileUrl)
    dispatch({ type: 'SET_AUDIO', fileName: file.name, url: URL.createObjectURL(file) })
    setIsPlaying(false)
    setDuration(0)
    setCurrent(0)
  }

  const togglePlay = () => {
    const el = audioRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setError('Preview failed'))
    }
  }

  const clearAudio = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
    if (audioFileUrl) URL.revokeObjectURL(audioFileUrl)
    dispatch({ type: 'CLEAR_AUDIO' })
    setDuration(0)
    setCurrent(0)
    setError('')
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div style={{
      flexShrink: 0,
      borderTop: '1px solid var(--border-subtle)',
      padding: '8px 12px 10px',
      background: 'var(--panel-bg)',
    }}>
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ ...MONO, fontSize: 9, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
          Audio track
        </p>
        {audioFileName && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ ...MONO, fontSize: 8.5, padding: '2px 6px', borderRadius: 4, background: 'var(--raised-bg)', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            Replace
          </button>
        )}
      </div>

      {error && <p style={{ fontSize: 10, color: 'var(--error-color)', marginBottom: 6 }}>{error}</p>}

      {/* Hidden audio element */}
      {audioFileUrl && (
        <audio
          ref={audioRef}
          src={audioFileUrl}
          loop
          onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration || 0)}
          onTimeUpdate={e => setCurrent((e.target as HTMLAudioElement).currentTime)}
          onEnded={() => setIsPlaying(false)}
          style={{ display: 'none' }}
        />
      )}

      {!audioFileName ? (
        <div
          className={`upload-zone${dragOver ? ' drag-over' : ''}`}
          style={{ padding: '10px 8px', gap: 3 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) loadFile(f)
          }}
        >
          <Music2 size={14} style={{ color: 'var(--text-tertiary)' }} />
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)' }}>Drop audio</p>
          <p style={{ fontSize: 9.5, color: 'var(--text-tertiary)' }}>MP3, WAV, OGG · 50 MB</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Player row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 8,
            background: 'var(--raised-bg)',
            border: '1px solid var(--border-default)',
          }}>
            <button
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: isPlaying ? 'var(--accent)' : 'var(--elevated-bg)',
                border: `1px solid ${isPlaying ? 'var(--accent-border)' : 'var(--border-default)'}`,
                boxShadow: isPlaying ? '0 0 8px var(--accent-glow)' : 'none',
              }}
            >
              {isPlaying ? (
                <span style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, width: 8, height: 10 }}>
                  <span style={{ background: '#fff', borderRadius: 1 }} />
                  <span style={{ background: '#fff', borderRadius: 1 }} />
                </span>
              ) : (
                <span style={{ width: 0, height: 0, borderStyle: 'solid', marginLeft: 2, borderWidth: '4px 0 4px 7px', borderColor: 'transparent transparent transparent var(--text-primary)' }} />
              )}
            </button>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...SANS, fontSize: 10.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 1 }} title={audioFileName ?? ''}>
                {audioFileName}
              </p>
              <p style={{ ...MONO, fontSize: 9, color: 'var(--text-tertiary)' }}>
                {fmtTime(current)} / {fmtTime(duration)}
              </p>
            </div>

            <button
              onClick={clearAudio}
              title="Remove"
              style={{ display: 'flex', background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-tertiary)', flexShrink: 0 }}
            >
              <X size={11} />
            </button>
          </div>

          {/* Progress bar */}
          <div
            style={{ height: 3, borderRadius: 99, background: 'var(--raised-bg)', cursor: 'pointer', overflow: 'hidden' }}
            onClick={e => {
              const el = audioRef.current
              if (!el || !duration) return
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
              el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 99,
                background: 'var(--accent)',
                width: `${progress}%`,
                transition: 'width 0.25s linear'
              }}
            />
          </div>

          {/* Mix toggle + Volume */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => dispatch({ type: 'SET_AUDIO_ENABLED', enabled: !audioEnabled })}
              title={audioEnabled ? 'Disable audio in recording' : 'Enable audio in recording'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 9px',
                borderRadius: 6,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
                background: audioEnabled ? 'var(--accent-muted)' : 'var(--raised-bg)',
                border: `1px solid ${audioEnabled ? 'var(--accent-border)' : 'var(--border-default)'}`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: audioEnabled ? 'var(--accent)' : 'var(--text-disabled)',
                  transition: 'background 0.15s',
                }}
              />
              <span style={{ ...MONO, fontSize: 8.5, fontWeight: 600, color: audioEnabled ? 'var(--accent)' : 'var(--text-tertiary)', letterSpacing: '0.04em' }}>
                {audioEnabled ? 'MIX ON' : 'MIX OFF'}
              </span>
            </button>

            <Volume2 size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />

            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audioVolume}
              onChange={e => {
                const v = parseFloat(e.target.value)
                dispatch({ type: 'SET_AUDIO_VOLUME', volume: v })
              }}
              style={{ flex: 1, accentColor: 'var(--accent)', cursor: 'pointer', height: 3 }}
            />

            <span style={{ ...MONO, fontSize: 9, color: 'var(--text-tertiary)', flexShrink: 0, minWidth: 24, textAlign: 'right' }}>
              {Math.round(audioVolume * 100)}%
            </span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) loadFile(f)
          e.currentTarget.value = ''
        }}
      />
    </div>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────
export function LeftPanel() {
  const { state } = useApp()

  // Optional: cleanup blob URLs & streams when source video changes / unmounts
  useEffect(() => {
    return () => {
      if (state.sourceVideoUrl) URL.revokeObjectURL(state.sourceVideoUrl)
      if (state.sourceVideoStream) {
        state.sourceVideoStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [state.sourceVideoUrl, state.sourceVideoStream])

  return (
    <aside className="panel-card" style={{ width: 218, flexShrink: 0 }}>
      <div className="panel-header" style={{ padding: '10px 12px 8px' }}>
        <span className="panel-title" style={{ fontSize: 12 }}>
          {state.params.mode === 'generate' ? 'Presets' : 'Source video'}
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingTop: 8 }}>
        {state.params.mode === 'generate' ? <PresetBrowser /> : <UploadZone />}
        <AudioSection />
      </div>
    </aside>
  )
}