'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const DB_URL = 'https://xoleric-9ad1b-default-rtdb.firebaseio.com'

export default function ConnectionStatus() {
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  useEffect(() => {
    let mounted = true
    let timeout: NodeJS.Timeout

    async function check() {
      try {
        const controller = new AbortController()
        timeout = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(`${DB_URL}/.json?shallow=true`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        clearTimeout(timeout)
        if (mounted) setStatus(res.ok ? 'online' : 'offline')
      } catch {
        if (mounted) setStatus('offline')
      }
      if (mounted) setTimeout(check, 15000)
    }
    check()
    return () => { mounted = false; clearTimeout(timeout) }
  }, [])

  if (status === 'online') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden"
      >
        <div className={`flex items-center justify-center gap-2 py-1.5 text-[10px] font-medium tracking-wide ${
          status === 'checking' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400 animate-signal'}`} />
          {status === 'checking' ? 'Signal tekshirilmoqda...' : 'Signal uzildi. Qayta ulanish...'}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
