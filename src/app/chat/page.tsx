'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getUser, getAllUsers, getMessages, sendMessage,
  addReaction, subscribeMessages, getNotifications,
  markNotifRead, updateUser, Message, User, Notification,
  getColor, timeAgo, escHtml, incrementVisits,
} from '@/lib/db'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Send, Image, LogOut, Bell, Smile, X } from 'lucide-react'

const REACTIONS = ['🔥', '❤️', '😂', '😮', '😢', '👍']

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [text, setText] = useState('')
  const [media, setMedia] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [typing, setTyping] = useState<string[]>([])
  const msgEnd = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // Load user
  useEffect(() => {
    const uid = localStorage.getItem('xolerc_uid')
    if (!uid) return router.push('/auth')
    getUser(uid).then(u => { if (u) setUser(u) })
  }, [router])

  // Load data
  useEffect(() => {
    if (!user) return
    getAllUsers().then(setUsers)
    getMessages().then(setMessages)
    getNotifications().then(setNotifs)
    incrementVisits()

    const unsub = subscribeMessages(setMessages)
    const poll = setInterval(() => {
      getAllUsers().then(setUsers)
      getNotifications().then(setNotifs)
    }, 3000)
    return () => { unsub(); clearInterval(poll) }
  }, [user])

  // Auto scroll
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Typing indicator
  useEffect(() => {
    if (!user) return
    const typingUsers = messages
      .filter(m => m.fromId !== user.id)
      .filter(m => Date.now() - m.time < 5000)
      .map(m => m.fromName)
    setTyping([...new Set(typingUsers)].slice(0, 3))
  }, [messages, user])

  // File to base64
  const readFile = useCallback((file: File): Promise<string> => {
    return new Promise(resolve => {
      if (file.size > 5 * 1024 * 1024) { alert('5MB dan oshmasin'); resolve(''); return }
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const maxW = 800
          if (img.width > maxW) {
            const c = document.createElement('canvas')
            const r = maxW / img.width
            c.width = maxW; c.height = img.height * r
            c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
            resolve(c.toDataURL('image/jpeg', 0.7))
          } else resolve(e.target?.result as string)
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [])

  async function handleSend() {
    if (!text.trim() && !media) return
    if (!user) return
    await sendMessage({
      fromId: user.id, fromName: user.username,
      fromAvatar: user.avatar, text: text.trim(), media,
    })
    setText('')
    setMedia('')
  }

  async function handleReaction(msgId: string, emoji: string) {
    setShowReactions(null)
    await addReaction(msgId, emoji)
  }

  async function handleLogout() {
    if (user) await updateUser(user.id, { online: false }).catch(() => {})
    localStorage.removeItem('xolerc_uid')
    router.push('/auth')
  }

  // Online users count
  const online = users.filter(u => u.online).length

  return (
    <main className="h-screen flex bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-72 min-w-72 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h2 className="text-[#FFDE02] font-bold text-sm tracking-widest">XOLERIC</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
              <Bell size={16} className="text-zinc-500" />
              {notifs.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFDE02] rounded-full" />
              )}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <LogOut size={16} className="text-zinc-500" />
            </button>
          </div>
        </div>

        {/* User card */}
        {user && (
          <div className="p-4 border-b border-white/[0.04] flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: user.avatar ? `url(${user.avatar}) center/cover` : `${getColor(user.username)}20`,
                color: getColor(user.username),
                boxShadow: `0 0 12px ${user.aura || '#FFDE02'}40`,
              }}
            >
              {user.avatar ? '' : user.username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <p className="text-xs text-green-500">online</p>
            </div>
            <div className="text-xs text-zinc-600">⚡{user.energy || 50}</div>
          </div>
        )}

        {/* Online users */}
        <div className="p-3 border-b border-white/[0.04]">
          <p className="text-xs text-zinc-500 mb-2 tracking-wider">ONLINE — {online}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {users.filter(u => u.online).slice(0, 8).map(u => (
              <div key={u.id} className="flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: `${getColor(u.username)}20`, color: getColor(u.username) }}
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-[10px] text-zinc-600 truncate max-w-[48px]">{u.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications panel */}
        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/[0.04]"
            >
              <div className="p-3 max-h-40 overflow-y-auto">
                <p className="text-xs text-zinc-500 mb-2 tracking-wider">PULSE</p>
                {notifs.length === 0 && <p className="text-xs text-zinc-600">Bo'sh</p>}
                {notifs.map(n => (
                  <div key={n.id} className="flex items-start gap-2 py-1.5" onClick={() => markNotifRead(n.id)}>
                    <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${n.read ? 'bg-zinc-700' : 'bg-[#FFDE02]'}`} />
                    <p className="text-xs text-zinc-400">{n.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">💬</div>
          <div>
            <h3 className="text-sm font-bold">Umumiy Chat</h3>
            <p className="text-xs text-zinc-500">{online} online • {messages.length} xabar</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-12 text-zinc-600 text-sm">Hali xabarlar yo'q</div>
          )}
          {messages.map(m => {
            const own = user && m.fromId === user.id
            return (
              <div key={m.id} className={`flex gap-2 max-w-[75%] ${own ? 'ml-auto flex-row-reverse' : ''}`}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1"
                  style={{ background: `${getColor(m.fromName)}20`, color: getColor(m.fromName) }}
                >
                  {m.fromName.charAt(0).toUpperCase()}
                </div>
                <div className={`min-w-0 ${own ? 'items-end' : ''}`}>
                  <p className={`text-[11px] font-semibold mb-0.5 ${own ? 'text-right text-[#FFDE02]' : 'text-zinc-500'}`}>
                    {own ? 'Siz' : m.fromName}
                  </p>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      own
                        ? 'bg-[#FFDE02]/10 rounded-tr-md'
                        : 'bg-white/5 rounded-tl-md'
                    }`}
                  >
                    {m.text && <p className="text-sm text-zinc-200 leading-relaxed">{m.text}</p>}
                    {m.media && (
                      <img
                        src={m.media}
                        alt="media"
                        className="mt-1.5 rounded-xl max-w-[240px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(m.media, '_blank')}
                      />
                    )}
                    {/* Reactions */}
                    <div className="flex items-center gap-2 mt-1">
                      {m.reaction && <span className="text-sm">{m.reaction}</span>}
                      <span className="text-[10px] text-zinc-600">{timeAgo(m.time)}</span>
                    </div>
                  </div>
                  {/* Reaction button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowReactions(showReactions === m.id ? null : m.id)}
                      className="text-xs text-zinc-600 hover:text-zinc-400 mt-0.5"
                    >
                      {m.reaction ? '😊' : '🙂'}
                    </button>
                    {showReactions === m.id && (
                      <div className="absolute bottom-full left-0 bg-zinc-900 border border-white/10 rounded-xl p-1.5 flex gap-1 shadow-xl z-10">
                        {REACTIONS.map(r => (
                          <button
                            key={r}
                            onClick={() => handleReaction(m.id, r)}
                            className="text-lg hover:scale-125 transition-transform px-0.5"
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing indicator */}
          {typing.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-zinc-600 flex items-center gap-2 mt-2"
            >
              <div className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {typing.join(', ')} yozmoqda...
            </motion.div>
          )}
          <div ref={msgEnd} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          {media && (
            <div className="relative inline-block mb-2">
              <img src={media} alt="preview" className="h-16 rounded-lg" />
              <button
                onClick={() => setMedia('')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              className="w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:border-[#FFDE02] hover:text-[#FFDE02] transition-all flex-shrink-0"
            >
              <Image size={18} />
              <input ref={fileInput} type="file" accept="image/*,.gif" hidden onChange={async e => {
                const f = e.target.files?.[0]
                if (f) setMedia(await readFile(f))
                e.target.value = ''
              }} />
            </button>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Xabar yozing..."
              rows={1}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] resize-none max-h-32"
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() && !media}
              className="w-10 h-10 rounded-xl bg-[#FFDE02] flex items-center justify-center text-black hover:bg-white transition-all disabled:opacity-30 flex-shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
