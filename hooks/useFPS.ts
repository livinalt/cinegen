'use client'

import { useEffect, useRef, useState } from 'react'

export function useFPS() {
  const [fps, setFps] = useState(0)
  const frames = useRef<number[]>([])
  const last = useRef(performance.now())
  const rafId = useRef<number>()

  useEffect(() => {
    function tick() {
      const now = performance.now()
      const delta = now - last.current
      last.current = now

      frames.current.push(1000 / delta)
      if (frames.current.length > 30) frames.current.shift()

      const avg = frames.current.reduce((a, b) => a + b, 0) / frames.current.length
      setFps(Math.round(avg))

      rafId.current = requestAnimationFrame(tick)
    }

    rafId.current = requestAnimationFrame(tick)
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current) }
  }, [])

  return fps
}
