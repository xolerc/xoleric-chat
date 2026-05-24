'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Zap, MessageCircle, Mic, Sparkles, Users, Shield } from 'lucide-react'
import Particles from '@/components/effects/Particles'

const features = [
  { icon: MessageCircle, text: 'Real-time chat' },
  { icon: Mic, text: 'Voice messages' },
  { icon: Sparkles, text: 'AI suggestions' },
  { icon: Users, text: 'Live online' },
  { icon: Shield, text: 'Unique identity' },
]

export default function LandingPage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)

  useEffect(() => { setUid(localStorage.getItem('xolerc_uid')) }, [])

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <Particles count={30} speed={0.1} />

      <div className="relative z-10 w-full max-w-lg mx-auto px-6 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-20 h-20 rounded-3xl bg-[#FFDE02]/10 flex items-center justify-center mx-auto mb-6"
          >
            <Zap size={48} className="text-[#FFDE02]" />
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-3">
            <span className="text-gradient">XOLERIC</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium tracking-[0.3em] mb-2">CHAT</p>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-[#FFDE02] to-transparent mx-auto mb-4" />
          <p className="text-zinc-600 text-sm max-w-xs mx-auto leading-relaxed">
            Chat emas. Raqamli atmosfera. Signalga qo'shiling.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.06] text-xs text-zinc-400"
            >
              <f.icon size={12} className="text-[#FFDE02]" />
              <span>{f.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <button
            onClick={() => router.push(uid ? '/chat' : '/auth')}
            className="w-full max-w-xs bg-[#FFDE02] text-black py-3.5 rounded-xl font-bold text-sm hover:bg-white transition-all tracking-wide"
          >
            {uid ? 'CHATGA KIRISH' : 'BOSHLASH'}
          </button>
          {!uid && (
            <p className="text-zinc-700 text-xs mt-3">Hisobingiz bormi? Kirish tugmasini bosing</p>
          )}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-zinc-800 text-[10px] mt-12 tracking-wider"
        >
          XOLERIC &copy; {new Date().getFullYear()}
        </motion.p>
      </div>
    </main>
  )
}
