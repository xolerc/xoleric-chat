'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const uid = localStorage.getItem('xolerc_uid')
    if (uid) router.replace('/chat')
    else router.replace('/auth')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505]">
      <div className="text-zinc-600 text-sm animate-pulse">XOLERIC CHAT ⚡</div>
    </div>
  )
}
