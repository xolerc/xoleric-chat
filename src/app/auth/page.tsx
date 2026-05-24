'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, User, ChevronRight } from 'lucide-react'
import { createUser, usernameExists, randomAura } from '@/lib/db'
import Particles from '@/components/effects/Particles'
import Button from '@/components/ui/Button'

const STEPS = ['welcome', 'setup', 'ready'] as const
type Step = typeof STEPS[number]

export default function AuthPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('welcome')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const uid = localStorage.getItem('xolerc_uid')
    if (uid) router.push('/chat')
  }, [router])

  useEffect(() => {
    if (step === 'setup') nameRef.current?.focus()
  }, [step])

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
    const trimmed = username.trim()
    if (!trimmed) { setError('Username kiriting'); return }
    setLoading(true)
    setError('')
    try {
      const exists = await usernameExists(trimmed)
      if (exists) { setError('Bu username band. Boshqasini tanlang.'); setLoading(false); return }
      const user = await createUser({ username: trimmed, bio, avatar, aura: randomAura() })
      localStorage.setItem('xolerc_uid', user.id)
      setStep('ready')
      setTimeout(() => router.push('/chat'), 800)
    } catch {
      setError('Xatolik yuz berdi. Qayta urinib ko\'ring.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Particles count={40} speed={0.12} />

      <div className="relative z-10 w-full max-w-sm px-5">
        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="glass-strong rounded-2xl p-8 text-center"
            >
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-[#FFDE02]/10 flex items-center justify-center mx-auto mb-6"
              >
                <Zap size={36} className="text-[#FFDE02]" />
              </motion.div>
              <h1 className="text-4xl font-black mb-2 tracking-tight">
                <span className="text-gradient">XOLERIC</span>
              </h1>
              <p className="text-zinc-500 text-sm mb-2 font-medium tracking-widest">ENTER THE SIGNAL</p>
              <p className="text-zinc-600 text-xs mb-8 leading-relaxed">
                Raqamli atmosferaga xush kelibsiz
              </p>
              <Button size="lg" className="w-full" onClick={() => setStep('setup')}>
                Kirish
                <ChevronRight size={16} />
              </Button>
            </motion.div>
          )}

          {step === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="glass-strong rounded-2xl p-8"
            >
              <h2 className="text-lg font-bold mb-1 tracking-tight">Profilingizni yarating</h2>
              <p className="text-zinc-500 text-xs mb-6">Username va avatar — sizning raqamli passingiz</p>

              {/* Avatar */}
              <div className="flex flex-col items-center mb-6">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ring-2 ring-[#FFDE02]/20 animate-pulse-glow"
                  style={{
                    '--aura-color': '#FFDE02',
                    background: avatar ? `url(${avatar}) center/cover` : 'rgba(255,222,2,0.08)',
                    color: '#FFDE02',
                  } as React.CSSProperties}
                >
                  {avatar ? '' : (username?.charAt(0)?.toUpperCase() || '?')}
                </div>
                <label className="text-xs text-[#FFDE02] cursor-pointer hover:text-white transition-colors font-medium">
                  Rasm yuklash
                  <input type="file" accept="image/*" hidden onChange={handleAvatar} />
                </label>
              </div>

              {/* Username */}
              <div className="relative mb-3">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  ref={nameRef}
                  value={username}
                  onChange={e => { setUsername(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleStart()}
                  placeholder="Username"
                  maxLength={30}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] transition-colors"
                />
              </div>

              {/* Bio */}
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Bio (ixtiyoriy)"
                maxLength={150}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] mb-5 resize-none transition-colors"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-xs mb-3 font-medium"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleStart}
                disabled={!username.trim()}
                loading={loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Yuklanmoqda...' : 'CHATGA KIRISH'}
              </Button>

              <button
                onClick={() => setStep('welcome')}
                className="w-full text-center text-xs text-zinc-600 mt-4 hover:text-zinc-400 transition-colors"
              >
                Ortga
              </button>
            </motion.div>
          )}

          {step === 'ready' && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-20 h-20 rounded-2xl bg-[#FFDE02]/10 flex items-center justify-center mx-auto mb-6"
              >
                <Zap size={44} className="text-[#FFDE02]" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Signal ulandi!</h2>
              <p className="text-zinc-500 text-sm">Chatga kirmoqda...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
