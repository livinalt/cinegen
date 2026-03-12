'use client'

import React, { useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { getPresetById } from '@/lib/presets'

interface Vec2 { x: number; y: number }

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number; opacity: number
  color: string
}

export const MockPreviewCanvas = React.forwardRef<HTMLCanvasElement>(function MockPreviewCanvas(_, forwardedRef) {
  const localRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = (forwardedRef as React.RefObject<HTMLCanvasElement>) || localRef
  const animRef = useRef<number>()
  const stateRef = useRef({
    time: 0,
    particles: [] as Particle[],
    hueShift: 0,
    seedX: Math.random() * 1000,
    seedY: Math.random() * 1000,
  })
  const { state } = useApp()
  const paramsRef = useRef(state.params)
  const stateSnapshot = useRef(state)

  // Keep refs current
  useEffect(() => { paramsRef.current = state.params }, [state.params])
  useEffect(() => { stateSnapshot.current = state }, [state])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Spawn particle ──────────────────────────────────────────────────────
    function spawnParticle(w: number, h: number, color: string): Particle {
      return {
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(0.3 + Math.random() * 0.6),
        life: 0,
        maxLife: 120 + Math.random() * 180,
        size: 1 + Math.random() * 2.5,
        opacity: 0.4 + Math.random() * 0.5,
        color,
      }
    }

    // ── Smooth noise approximation ──────────────────────────────────────────
    function noise(x: number, y: number, t: number): number {
      return (
        Math.sin(x * 0.8 + t) * Math.cos(y * 0.6 + t * 0.7) * 0.5 +
        Math.sin(x * 0.3 + t * 1.3) * Math.cos(y * 0.4 + t * 0.9) * 0.3 +
        Math.sin(x * 1.5 + t * 0.4) * Math.cos(y * 1.1 + t * 1.1) * 0.2
      )
    }

    // ── Draw frame ──────────────────────────────────────────────────────────
    function draw() {
      const p = paramsRef.current
      const s = stateSnapshot.current
      const { time, particles, seedX, seedY } = stateRef.current
      const w = canvas.width, h = canvas.height

      if (p.blackout) {
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        animRef.current = requestAnimationFrame(draw)
        return
      }

      if (p.freeze) {
        animRef.current = requestAnimationFrame(draw)
        return
      }

      const preset = getPresetById(p.activePresetId)
      const colors = preset?.colors || ['#f0d060', '#e8a840', '#faeea0']
      const baseHue = preset?.hue || 45
      const speed = p.motionSpeed * 0.015
      const brightness = 0.6 + p.brightness * 0.8

      stateRef.current.time += speed
      stateRef.current.hueShift += speed * 0.3

      const t = stateRef.current.time

      // ── Background gradient ─────────────────────────────────────────────
      const nx = noise(seedX, seedY, t * 0.5)
      const ny = noise(seedX + 100, seedY + 100, t * 0.4)

      const gx = w * (0.3 + nx * 0.4)
      const gy = h * (0.2 + ny * 0.4)

      const grad = ctx.createRadialGradient(gx, gy, 0, w * 0.5, h * 0.5, w * 0.85)

      // Parse hex color to hsl for dynamic shifting
      const hue1 = (baseHue + stateRef.current.hueShift * 10) % 360
      const hue2 = (baseHue + 20 + stateRef.current.hueShift * 6) % 360
      const hue3 = (baseHue - 15 + stateRef.current.hueShift * 4) % 360
      const sat  = 50 + p.atmosphere * 30
      const lum1 = Math.round(8 * brightness)
      const lum2 = Math.round(18 * brightness)
      const lum3 = Math.round(5 * brightness)

      grad.addColorStop(0,   `hsl(${hue1}, ${sat}%, ${lum2}%)`)
      grad.addColorStop(0.4, `hsl(${hue2}, ${sat - 10}%, ${lum1}%)`)
      grad.addColorStop(0.7, `hsl(${hue3}, ${sat + 5}%, ${Math.round(lum1 * 0.7)}%)`)
      grad.addColorStop(1,   `hsl(${hue3}, ${sat}%, ${lum3}%)`)

      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      // ── Light rays ─────────────────────────────────────────────────────
      const numRays = 4
      for (let i = 0; i < numRays; i++) {
        const angle = -Math.PI * 0.35 + (i / numRays) * Math.PI * 0.3
          + Math.sin(t * 0.4 + i) * 0.08
        const ox = w * (0.3 + i * 0.15 + Math.sin(t * 0.3 + i * 1.2) * 0.04)
        const oy = -20

        const rayGrad = ctx.createLinearGradient(
          ox, oy,
          ox + Math.sin(angle) * h * 1.5,
          oy + Math.cos(angle) * h * 1.5
        )

        const rayAlpha = (0.04 + p.atmosphere * 0.06) * (1 - i * 0.15)
        rayGrad.addColorStop(0, `hsla(${hue1 + 10}, 80%, 80%, ${rayAlpha})`)
        rayGrad.addColorStop(1, `hsla(${hue1 + 10}, 80%, 80%, 0)`)

        ctx.save()
        ctx.translate(ox, oy)
        ctx.rotate(angle)

        const rayWidth = 60 + i * 25 + Math.sin(t * 0.5 + i) * 15
        ctx.fillStyle = rayGrad

        // Draw tapered ray
        ctx.beginPath()
        ctx.moveTo(-rayWidth * 0.5, 0)
        ctx.lineTo(-rayWidth * 2,   h * 1.5)
        ctx.lineTo( rayWidth * 2,   h * 1.5)
        ctx.lineTo( rayWidth * 0.5, 0)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // ── Floating atmosphere blobs ───────────────────────────────────────
      for (let i = 0; i < 5; i++) {
        const bx = w * (0.15 + i * 0.18 + Math.sin(t * 0.25 + i * 1.5) * 0.08)
        const by = h * (0.2 + Math.cos(t * 0.18 + i * 2.1) * 0.25)
        const br = w * (0.12 + Math.sin(t * 0.3 + i) * 0.04)

        const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br)
        const bHue = (hue1 + i * 15) % 360
        const bAlpha = (0.06 + p.atmosphere * 0.08) * brightness
        bGrad.addColorStop(0, `hsla(${bHue}, 70%, 70%, ${bAlpha})`)
        bGrad.addColorStop(1, `hsla(${bHue}, 70%, 70%, 0)`)

        ctx.fillStyle = bGrad
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.fill()
      }

      // ── Particles ──────────────────────────────────────────────────────
      // Spawn
      if (particles.length < 20 && Math.random() < 0.35) {
        particles.push(spawnParticle(w, h, colors[Math.floor(Math.random() * colors.length)]))
      }

      // Update and draw
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i]
        pt.x += pt.vx
        pt.y += pt.vy
        pt.life++

        if (pt.life >= pt.maxLife || pt.y < -20) {
          particles.splice(i, 1)
          continue
        }

        const lifeRatio = pt.life / pt.maxLife
        const alpha = pt.opacity * (1 - lifeRatio) * Math.sin(lifeRatio * Math.PI)

        ctx.globalAlpha = alpha
        ctx.fillStyle = pt.color
        ctx.beginPath()
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // ── FX: Grain ──────────────────────────────────────────────────────
      if (p.fxGrain) {
        const imageData = ctx.getImageData(0, 0, w, h)
        const data = imageData.data
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 18
          data[i]   = Math.max(0, Math.min(255, data[i]   + noise))
          data[i+1] = Math.max(0, Math.min(255, data[i+1] + noise))
          data[i+2] = Math.max(0, Math.min(255, data[i+2] + noise))
        }
        ctx.putImageData(imageData, 0, 0)
      }

      // ── FX: Glow ───────────────────────────────────────────────────────
      if (p.fxGlow) {
        ctx.save()
        ctx.filter = 'blur(8px)'
        ctx.globalCompositeOperation = 'screen'
        ctx.globalAlpha = 0.2
        ctx.drawImage(canvas, 0, 0)
        ctx.restore()
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = 'source-over'
      }

      // ── FX: Vignette ───────────────────────────────────────────────────
      if (p.fxVignette) {
        const vGrad = ctx.createRadialGradient(w/2, h/2, h*0.3, w/2, h/2, h*0.85)
        vGrad.addColorStop(0, 'rgba(0,0,0,0)')
        vGrad.addColorStop(1, 'rgba(0,0,0,0.45)')
        ctx.fillStyle = vGrad
        ctx.fillRect(0, 0, w, h)
      }

      // ── Lyrics overlay ─────────────────────────────────────────────────
      if (p.lyricsEnabled && s.lyricsLines.length > 0) {
        const current = s.lyricsLines[s.activeLyricIndex]
        const next    = s.lyricsLines[s.activeLyricIndex + 1]

        const fontSize = Math.max(18, Math.min(32, w * 0.028))
        const lyPos = (s as any).lyricsPosition || 'bottom'
        const pad = fontSize * 2
        const ly = lyPos === 'top' ? pad : lyPos === 'center' ? h * 0.50 : h - pad

        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Measure for pill background
        ctx.font = `700 ${fontSize}px Inter, sans-serif`
        const metrics = ctx.measureText(current)
        const pillW = metrics.width + 48, pillH = fontSize + 22
        const rx = w / 2 - pillW / 2, ry = ly - pillH / 2, rr = pillH / 2

        ctx.save()
        ctx.globalAlpha = 0.38
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.moveTo(rx + rr, ry)
        ctx.lineTo(rx + pillW - rr, ry)
        ctx.arcTo(rx + pillW, ry, rx + pillW, ry + rr, rr)
        ctx.lineTo(rx + pillW, ry + pillH - rr)
        ctx.arcTo(rx + pillW, ry + pillH, rx + pillW - rr, ry + pillH, rr)
        ctx.lineTo(rx + rr, ry + pillH)
        ctx.arcTo(rx, ry + pillH, rx, ry + pillH - rr, rr)
        ctx.lineTo(rx, ry + rr)
        ctx.arcTo(rx, ry, rx + rr, ry, rr)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        // Current lyric
        ctx.font = `700 ${fontSize}px Inter, sans-serif`
        ctx.shadowColor = 'rgba(0,0,0,0.9)'
        ctx.shadowBlur = 16
        ctx.fillStyle = '#ffffff'
        ctx.fillText(current, w / 2, ly)

        // Next lyric (always below when bottom/center; above when top)
        if (next) {
          const nSize = Math.max(11, Math.min(17, w * 0.015))
          ctx.font = `400 ${nSize}px Inter, sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.38)'
          ctx.shadowBlur = 6
          const yOffset = lyPos === 'top' ? -(fontSize + 12) : fontSize + 12
          ctx.fillText(next, w / 2, ly + yOffset)
        }

        ctx.shadowBlur = 0
        ctx.textAlign = 'start'
      }

      // ── Watermark ──────────────────────────────────────────────────────
      if (p.watermarkEnabled) {
        ctx.font = '500 11px DM Mono, monospace'
        ctx.textAlign = 'right'
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.fillText('CINEGEN FREE', w - 16, h - 16)
        ctx.textAlign = 'start'
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, []) // only run once — reads from refs

  return (
    <canvas
      ref={(node) => {
        (localRef as any).current = node
        if (typeof forwardedRef === 'function') forwardedRef(node)
        else if (forwardedRef) (forwardedRef as any).current = node
      }}
      className="w-full h-full block"
      style={{ display: 'block' }}
    />
  )
})
