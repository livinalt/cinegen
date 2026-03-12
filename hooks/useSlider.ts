'use client'

import { useRef, useCallback } from 'react'

interface UseSliderOptions {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}

export function useSlider({ value, onChange, min = 0, max = 1 }: UseSliderOptions) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  // Keep latest min/max in refs so drag closure never goes stale
  const minRef = useRef(min)
  const maxRef = useRef(max)
  minRef.current = min
  maxRef.current = max

  const getValueFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    return parseFloat((minRef.current + pct * (maxRef.current - minRef.current)).toFixed(2))
  }, []) // stable — reads from refs

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    onChange(getValueFromEvent(e.clientX))

    const onMove = (ev: MouseEvent) => {
      if (isDragging.current) onChange(getValueFromEvent(ev.clientX))
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [getValueFromEvent, onChange])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    onChange(getValueFromEvent(e.touches[0].clientX))

    const onMove = (ev: TouchEvent) => {
      if (isDragging.current) onChange(getValueFromEvent(ev.touches[0].clientX))
    }
    const onEnd = () => {
      isDragging.current = false
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
    window.addEventListener('touchmove', onMove)
    window.addEventListener('touchend', onEnd)
  }, [getValueFromEvent, onChange])

  const percent = ((value - min) / (max - min)) * 100

  return { trackRef, onMouseDown, onTouchStart, percent }
}
