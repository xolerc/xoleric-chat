'use client'

import { useState, useRef } from 'react'
import { updateUser, usernameExists } from '@/lib/db'
import type { User } from '@/lib/db'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'

interface Props {
  user: User
  open: boolean
  onClose: () => void
  onSave: (updated: User) => void
}

export default function EditProfileModal({ user, open, onClose, onSave }: Props) {
  const [username, setUsername] = useState(user.username)
  const [bio, setBio] = useState(user.bio || '')
  const [avatar, setAvatar] = useState(user.avatar || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    const trimmed = username.trim()
    if (!trimmed) { setError('Username kiriting'); return }
    setLoading(true); setError('')
    try {
      if (trimmed.toLowerCase() !== user.username.toLowerCase()) {
        const exists = await usernameExists(trimmed)
        if (exists) { setError('Bu username band'); setLoading(false); return }
      }
      const data: Partial<User> = { username: trimmed, bio, avatar }
      await updateUser(user.id, data)
      onSave({ ...user, ...data })
      onClose()
    } catch { setError('Xatolik yuz berdi') }
    finally { setLoading(false) }
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        const maxW = 200
        if (img.width > maxW) {
          const c = document.createElement('canvas')
          const r = maxW / img.width
          c.width = maxW; c.height = img.height * r
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
          setAvatar(c.toDataURL('image/jpeg', 0.7))
        } else setAvatar(ev.target?.result as string)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(f)
  }

  return (
    <Modal open={open} onClose={onClose} title="PROFILNI TAHRIRLASH">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ring-2 ring-[#FFDE02]/20"
          style={{
            background: avatar ? `url(${avatar}) center/cover` : 'rgba(255,222,2,0.08)',
            color: '#FFDE02',
          }}
        >
          {avatar ? '' : username?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-[#FFDE02] hover:text-white transition-colors font-medium cursor-pointer bg-none border-none"
        >
          Rasmni almashtirish
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
      </div>

      <input
        value={username}
        onChange={e => { setUsername(e.target.value); setError('') }}
        placeholder="Username"
        maxLength={30}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] mb-3 transition-colors"
      />
      <textarea
        value={bio}
        onChange={e => setBio(e.target.value)}
        placeholder="Bio (ixtiyoriy)"
        maxLength={150}
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] mb-4 resize-none transition-colors"
      />

      {error && <p className="text-red-400 text-xs mb-3 font-medium">{error}</p>}

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>Bekor qilish</Button>
        <Button className="flex-1" onClick={handleSave} loading={loading}>Saqlash</Button>
      </div>
    </Modal>
  )
}
