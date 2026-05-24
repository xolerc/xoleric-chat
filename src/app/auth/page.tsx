'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, updateUser, randomAura, usernameExists } from '@/lib/db'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export default function AuthPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [step, setStep] = useState<'welcome' | 'setup'>('welcome')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const uid = localStorage.getItem('xolerc_uid')
    if (uid) router.push('/chat')
  }, [router])

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')!
    let w = c.width = window.innerWidth
    let h = c.height = window.innerHeight
    const pts = Array.from({length:50}, () => ({
      x:Math.random()*w, y:Math.random()*h,
      vx:(Math.random()-0.5)*0.2, vy:(Math.random()-0.5)*0.2,
      r:Math.random()*2+0.5, o:Math.random()*0.2+0.05
    }))
    function draw() {
      ctx.clearRect(0,0,w,h)
      pts.forEach(p => {
        p.x+=p.vx; p.y+=p.vy
        if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0
        ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2)
        ctx.fillStyle=`rgba(255,255,255,${p.o})`; ctx.fill()
      })
      requestAnimationFrame(draw)
    }
    draw()
    const resize = () => { w=c.width=window.innerWidth; h=c.height=window.innerHeight }
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 200
        if (img.width > maxW) {
          const canvas = document.createElement('canvas')
          const ratio = maxW / img.width
          canvas.width = maxW; canvas.height = img.height * ratio
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          setAvatar(canvas.toDataURL('image/jpeg', 0.7))
        } else setAvatar(ev.target?.result as string)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(f)
  }

  async function handleStart() {
    setLoading(true)
    try {
      const exists = await usernameExists(username)
      if (exists) { alert('Bu username band. Boshqasini tanlang.'); setLoading(false); return }
      const user = await createUser({ username, bio, avatar, aura: randomAura() })
      localStorage.setItem('xolerc_uid', user.id)
      router.push('/chat')
    } catch (e) {
      alert('Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm px-6"
      >
        {step === 'welcome' ? (
          <div className="text-center">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-8"
            >
              <Zap size={48} className="mx-auto text-[#FFDE02]" />
            </motion.div>
            <h1 className="text-4xl font-black mb-2">
              <span className="text-gradient">XOLERIC</span>
            </h1>
            <p className="text-zinc-500 text-sm mb-8">ENTER THE SIGNAL</p>
            <button
              onClick={() => setStep('setup')}
              className="w-full bg-[#FFDE02] text-black py-3.5 rounded-xl font-bold text-sm hover:bg-white transition-all"
            >
              Kirish
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-1">Profilingizni yarating</h2>
            <p className="text-zinc-500 text-xs mb-6">Username va avatar — sizning raqamli passingiz</p>

            <div className="flex flex-col items-center mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3"
                style={{
                  background: avatar ? `url(${avatar}) center/cover` : 'rgba(255,222,2,0.12)',
                  color: '#FFDE02',
                }}
              >
                {avatar ? '' : username?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <label className="text-xs text-[#FFDE02] cursor-pointer hover:underline">
                Rasm yuklash
                <input type="file" accept="image/*" hidden onChange={handleAvatar} />
              </label>
            </div>

            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Username"
              maxLength={30}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] mb-3"
            />
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Bio (ixtiyoriy)"
              maxLength={150}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] mb-6 resize-none"
            />

            <button
              onClick={handleStart}
              disabled={!username.trim() || loading}
              className="w-full bg-[#FFDE02] text-black py-3.5 rounded-xl font-bold text-sm hover:bg-white transition-all disabled:opacity-40"
            >
              {loading ? 'Yuklanmoqda...' : 'CHATGA KIRISH'}
            </button>
          </div>
        )}
      </motion.div>
    </main>
  )
}
