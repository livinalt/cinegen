'use client'

/**
 * Slider — fixed issues:
 * 1. Removed the built-in label/value row — callers handle labelling themselves
 * 2. Track is dark (sunken-bg) not bright — premium feel
 * 3. Fill uses accent but slightly muted
 * 4. Thumb is small and clean
 */

import { useSlider } from '@/hooks/useSlider'

interface SliderProps {
  value: number
  onChange: (v: number) => void
  label?: string   // kept for aria only — not rendered
  min?: number
  max?: number
  accentColor?: string
}

export function Slider({ value, onChange, label = '', min = 0, max = 1, accentColor }: SliderProps) {
  const { trackRef, onMouseDown, onTouchStart, percent } = useSlider({ value, onChange, min, max })
  const accent = accentColor || 'var(--accent)'

  return (
    <div
      ref={trackRef}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      role="slider"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={e => {
        const step = 0.05
        if (e.key === 'ArrowRight') onChange(Math.min(max, parseFloat((value + step).toFixed(2))))
        if (e.key === 'ArrowLeft')  onChange(Math.max(min, parseFloat((value - step).toFixed(2))))
      }}
      style={{
        position: 'relative',
        height: 5,
        borderRadius: 99,
        /* Dark track — premium, not bright */
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {/* Fill */}
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${percent}%`,
        borderRadius: 99,
        background: accent,
        opacity: 0.85,
        pointerEvents: 'none',
      }} />
      {/* Thumb */}
      <div style={{
        position: 'absolute',
        width: 12, height: 12,
        borderRadius: '50%',
        background: '#fff',
        border: `2px solid ${accent}`,
        top: '50%', left: `${percent}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }} />
    </div>
  )
}
