'use client'

import { useRef, useEffect } from 'react'

interface Props {
  count?: number
  color?: string
  speed?: number
}

export default function Particles({ count = 50, color = '255,255,255', speed = 0.15 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w = c.width = window.innerWidth
    let h = c.height = window.innerHeight
    let running = true

    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
      r: Math.random() * 2 + 0.3,
      o: Math.random() * 0.15 + 0.03,
    }))

    function draw() {
      if (!running) return
      ctx.clearRect(0, 0, w, h)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color},${p.o})`
        ctx.fill()
      })
      requestAnimationFrame(draw)
    }
    draw()

    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => { running = false; window.removeEventListener('resize', resize) }
  }, [count, color, speed])

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />
}
