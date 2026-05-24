'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Zap, MessageCircle, User, Shield, Sparkles, Ghost } from 'lucide-react'

function ParticleBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w = c.width = window.innerWidth
    let h = c.height = window.innerHeight
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 2 + 0.5, o: Math.random() * 0.3 + 0.05,
    }))

    function draw() {
      ctx.clearRect(0, 0, w, h)
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.o})`; ctx.fill()
      })
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.strokeStyle = `rgba(255,255,255,${0.02 * (1 - d / 100)})`; ctx.stroke()
          }
        }
      }
      requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { w = c.width = window.innerWidth; h = c.height = window.innerHeight }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none z-0" />
}

const features = [
  { icon: Zap, title: 'Neural Presence', desc: 'Avatar pulse qiladi, typing aura o\'zgartiradi, voice signal wave chiqaradi.' },
  { icon: Sparkles, title: 'AI Layer', desc: 'Mood detection, smart summaries, AI reply suggestions, auto translation.' },
  { icon: Ghost, title: 'Secret Rooms', desc: 'PIN access, self destruct, screenshot detect, encrypted messages.' },
  { icon: User, title: 'Dynamic Profile', desc: 'Animated avatar, energy level, aura color, sound signature.' },
  { icon: MessageCircle, title: 'Realtime Chat', desc: 'Instant messaging, reactions, voice messages, disappearing mode.' },
  { icon: Shield, title: 'E2E Security', desc: 'Device binding, anti-session hijack, encrypted media cache.' },
]

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <ParticleBg />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-bold tracking-[0.2em] text-[#FFDE02]">XOLERIC</span>
          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#tech" className="hover:text-white transition-colors">Tech</a>
            <a href="https://github.com/xolerc/xoleric-chat" target="_blank" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-xs tracking-[0.3em] text-zinc-500 mb-6"
          >
            XOLERIC CHAT ⚡
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-black tracking-tight leading-none mb-6"
          >
            <span className="text-gradient">Chat app emas.</span>
            <br />
            <span className="text-white">Raqamli atmosfera.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-zinc-500 text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed"
          >
            TikTok + Discord + Telegram + Neural OS vibe. Ultra tez realtime muloqot,
            cyber/minimal interface, AI + status + energy vibe.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <a href="#features" className="inline-flex items-center gap-2 bg-[#FFDE02] text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-white transition-all">
              <Zap size={16} /> Explore
            </a>
            <a href="https://github.com/xolerc/xoleric-chat" target="_blank" className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 px-6 py-3 rounded-xl font-bold text-sm hover:border-[#FFDE02] hover:text-[#FFDE02] transition-all">
              GitHub
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-4"
          >
            Core <span className="text-gradient">Features</span>
          </motion.h2>
          <p className="text-zinc-500 text-sm text-center mb-16 max-w-xl mx-auto">
            XOLERIC — bu oddiy messenger emas. Interface itself feels alive.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 hover:border-[#FFDE02]/30 transition-all group"
              >
                <f.icon size={28} className="text-[#FFDE02] mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-sm mb-2 tracking-wider">{f.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-center mb-16"
          >
            Tech <span className="text-gradient">Stack</span>
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { title: 'Frontend', items: ['Next.js', 'Tailwind', 'Framer Motion', 'TypeScript'] },
              { title: 'Backend', items: ['Supabase', 'Redis', 'PostgreSQL', 'Prisma ORM'] },
              { title: 'AI', items: ['OpenAI API', 'Vector DB', 'Voice AI', 'Mood Detection'] },
            ].map((cat, i) => (
              <motion.div
                key={cat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-8"
              >
                <h3 className="text-[#FFDE02] font-bold text-sm tracking-wider mb-6">{cat.title}</h3>
                <div className="flex flex-col gap-3">
                  {cat.items.map(item => (
                    <span key={item} className="text-zinc-400 text-sm">{item}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-zinc-600 text-xs tracking-wider">
          XOLERIC CHAT &copy; 2026 — Operating layer for human presence.
        </p>
      </footer>
    </main>
  )
}
