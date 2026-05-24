'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getUser, getAllUsers, getMessages, sendMessage,
  subscribeMessages, getNotifications, markNotifRead,
  updateUser, addReaction, deleteMessage, editMessage,
  Message, User, Notification,
} from '@/lib/db'
import { detectMood, moodEmoji, moodColor, getSuggestions, generateSummary } from '@/lib/ai'
import { startRecording, stopRecording, blobToBase64, playAudio, isSpeechSupported, speechToText } from '@/lib/voice'
import { motion, AnimatePresence } from 'framer-motion'

import Sidebar from '@/components/chat/Sidebar'
import MobileHeader from '@/components/chat/MobileHeader'
import MessageBubble from '@/components/chat/MessageBubble'
import InputArea from '@/components/chat/InputArea'
import EditProfileModal from '@/components/chat/EditProfileModal'
import Lightbox from '@/components/ui/Lightbox'
import ConnectionStatus from '@/components/chat/ConnectionStatus'
import { playNotification, playSend } from '@/lib/sound'

export default function ChatPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [text, setText] = useState('')
  const [media, setMedia] = useState('')
  const [showNotif, setShowNotif] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<ReturnType<typeof getSuggestions>>([])
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)
  const [recTime, setRecTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [typing, setTyping] = useState<string[]>([])
  const [mood, setMood] = useState<string>('neutral')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [editingMsg, setEditingMsg] = useState<Message | null>(null)
  const msgContainer = useRef<HTMLDivElement>(null)
  const [showScrollDown, setShowScrollDown] = useState(false)
  const msgEnd = useRef<HTMLDivElement>(null)
  const recTimer = useRef<NodeJS.Timeout | null>(null)
  const recStart = useRef(0)

  // ─── Load user ───
  useEffect(() => {
    const uid = localStorage.getItem('xolerc_uid')
    if (!uid) return router.push('/auth')
    getUser(uid).then(u => { if (u) { setUser(u); updateUser(u.id, { online: true }).catch(() => {}) } })
  }, [router])

  // ─── Load data ───
  useEffect(() => {
    if (!user) return
    getAllUsers().then(setUsers)
    getMessages().then(setMessages)
    getNotifications().then(setNotifs)

    const unsub = subscribeMessages(setMessages)
    const poll = setInterval(() => {
      getAllUsers().then(setUsers)
      getNotifications().then(setNotifs)
    }, 3000)
    return () => { unsub(); clearInterval(poll) }
  }, [user])

  // ─── Auto scroll ───
  useEffect(() => { msgEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // ─── Scroll detection ───
  useEffect(() => {
    const el = msgContainer.current
    if (!el) return
    const handler = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollDown(dist > 200)
    }
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [])

  // ─── Sound on new message ───
  const prevCount = useRef(messages.length)
  useEffect(() => {
    if (prevCount.current > 0 && messages.length > prevCount.current) {
      const last = messages[messages.length - 1]
      if (last && last.fromId !== user?.id) playNotification()
    }
    prevCount.current = messages.length
  }, [messages, user])

  // ─── Mood detection ───
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.fromId !== user?.id) {
      setMood(detectMood(last.text))
    }
  }, [messages, user])

  // ─── Typing indicator ───
  useEffect(() => {
    if (!user) return
    const recent = messages
      .filter(m => m.fromId !== user.id)
      .filter(m => Date.now() - m.time < 5000)
      .map(m => m.fromName)
    setTyping([...new Set(recent)].slice(0, 3))
  }, [messages, user])

  // ─── AI suggestions ───
  useEffect(() => {
    if (text.trim().length > 2) {
      setSuggestions(getSuggestions(text))
      setShowSuggestions(true)
    } else setShowSuggestions(false)
  }, [text])

  // ─── Read file → base64 ───
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

  // ─── Send / Edit message ───
  async function handleSend() {
    if ((!text.trim() && !media) || !user) return
    if (editingMsg) {
      await editMessage(editingMsg.id, text.trim()).catch(() => {})
      setEditingMsg(null)
    } else {
      playSend()
      await sendMessage({
        fromId: user.id, fromName: user.username,
        fromAvatar: user.avatar, text: text.trim(), media,
        replyTo: replyTo?.id || '', replyToName: replyTo?.fromName || '',
      })
    }
    setText(''); setMedia(''); setReplyTo(null); setShowSuggestions(false)
    const newEnergy = Math.min(100, (user.energy || 50) + 2)
    setUser({ ...user, energy: newEnergy })
    await updateUser(user.id, { energy: newEnergy }).catch(() => {})
  }

  async function handleSuggestion(s: { text: string; emoji: string }) {
    if (!user) return
    await sendMessage({
      fromId: user.id, fromName: user.username,
      fromAvatar: user.avatar, text: s.text,
    })
    setShowSuggestions(false)
  }

  // ─── Logout ───
  async function handleLogout() {
    if (user) await updateUser(user.id, { online: false }).catch(() => {})
    localStorage.removeItem('xolerc_uid')
    router.push('/auth')
  }

  // ─── Voice record ───
  async function toggleRecording() {
    if (recording) {
      try {
        const blob = await stopRecording()
        if (recTimer.current) clearInterval(recTimer.current)
        setRecording(false); setRecTime(0)
        const b64 = await blobToBase64(blob)
        setMedia(b64)
      } catch {}
    } else {
      try {
        recStart.current = Date.now()
        await startRecording()
        setRecording(true)
        recTimer.current = setInterval(() => {
          setRecTime(Math.floor((Date.now() - recStart.current) / 1000))
        }, 1000)
      } catch { alert('Mikrofonga ruxsat berilmagan') }
    }
  }

  async function handleSpeechToText() {
    if (!isSpeechSupported()) { alert('Brauzer ovozni qo\'llab-quvvatlamaydi'); return }
    setTranscribing(true)
    try {
      const transcript = await speechToText()
      setText(prev => prev + ' ' + transcript)
    } catch {
      alert('Ovoz tushunilmadi')
    } finally {
      setTranscribing(false)
    }
  }

  function playVoiceMsg(b64: string) {
    if (playing === b64) { setPlaying(null); return }
    setPlaying(b64)
    playAudio(b64).finally(() => setPlaying(null))
  }

  // ─── Energy boost ───
  function handleEnergyClick() {
    if (!user) return
    const e = Math.min(100, (user.energy || 50) + 5)
    setUser({ ...user, energy: e })
    updateUser(user.id, { energy: e }).catch(() => {})
  }

  // ─── Reactions ───
  async function handleReact(msgId: string, emoji: string) {
    await addReaction(msgId, emoji).catch(() => {})
    getMessages().then(setMessages)
  }

  // ─── Delete ───
  async function handleDelete(msgId: string) {
    if (!confirm("O'chirilsinmi?")) return
    await deleteMessage(msgId).catch(() => {})
    getMessages().then(setMessages)
  }

  // ─── Loading ───
  useEffect(() => {
    if (messages.length > 0 || user === null) return
    const t = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(t)
  }, [messages, user])

  // ─── Image lightbox ───
  function handleImageClick(src: string) {
    const allImages = messages
      .filter(m => m.media && !m.media.startsWith('data:audio'))
      .map(m => m.media!)
    const idx = allImages.indexOf(src)
    setLightbox({ images: allImages, index: idx >= 0 ? idx : 0 })
  }

  // ─── Date helpers ───
  function getDateLabel(ts: number): string {
    const d = new Date(ts)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
    if (d.toDateString() === today.toDateString()) return 'Bugun'
    if (d.toDateString() === yesterday.toDateString()) return 'Kecha'
    return d.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  function shouldShowDate(msg: Message, idx: number): boolean {
    if (idx === 0) return true
    const prev = messages[idx - 1]
    if (!prev || !prev.time) return false
    const d1 = new Date(prev.time).toDateString()
    const d2 = new Date(msg.time).toDateString()
    return d1 !== d2
  }

  // ─── Derived ───
  const onlineUsers = users.filter(u => u.online)
  const summary = generateSummary(messages.slice(-20).map(m => ({ fromName: m.fromName, text: m.text })))
  const lastMood = mood as ReturnType<typeof detectMood>

  return (
    <main className="h-screen flex bg-[#050505] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        users={users}
        notifs={notifs}
        onlineCount={onlineUsers.length}
        moodEmoji={moodEmoji(lastMood)}
        moodColor={moodColor(lastMood)}
        showAi={showAiPanel}
        showSummary={showSummary}
        showNotif={showNotif}
        summary={summary}
        onToggleAi={() => setShowAiPanel(!showAiPanel)}
        onToggleSummary={() => setShowSummary(!showSummary)}
        onToggleNotif={() => setShowNotif(!showNotif)}
        onLogout={handleLogout}
        onMarkRead={markNotifRead}
        onEnergyClick={handleEnergyClick}
        onEditProfile={() => setShowEditProfile(true)}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile header */}
        <MobileHeader
          onlineCount={onlineUsers.length}
          messageCount={messages.length}
          moodEmoji={moodEmoji(lastMood)}
          onMenuClick={() => setSidebarOpen(true)}
        />

        {/* Connection */}
        <ConnectionStatus />

        {/* Messages */}
        <div ref={msgContainer} className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <p className="text-zinc-600 text-sm font-medium mb-1">Hali xabarlar yo'q</p>
              <p className="text-zinc-700 text-xs">Birinchi bo'ling! Signal yuboring ⚡</p>
            </div>
          ) : (
            <>
              {messages.map((m, idx) => {
                const own = user && m.fromId === user.id
                return (
                  <div key={m.id}>
                    {shouldShowDate(m, idx) && (
                      <div className="flex items-center justify-center my-4">
                        <span className="text-[10px] text-zinc-700 bg-white/[0.03] px-3 py-1 rounded-full font-medium tracking-wide">
                          {getDateLabel(m.time)}
                        </span>
                      </div>
                    )}
                    <MessageBubble
                      msg={m}
                      isOwn={!!own}
                      messages={messages}
                      playing={playing}
                      onPlayVoice={playVoiceMsg}
                      onReact={handleReact}
                      onDelete={own ? handleDelete : undefined}
                      onImageClick={handleImageClick}
                      onReply={setReplyTo}
                      onEdit={own && m.text ? msg => { setEditingMsg(msg); setText(msg.text); setReplyTo(null) } : undefined}
                    />
                  </div>
                )
              })}

              {/* Mood wave */}
              {messages.length > 0 && messages[messages.length - 1]?.fromId !== user?.id && mood !== 'neutral' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600 animate-fade-up"
                >
                  <span className="text-xs">{moodEmoji(lastMood)}</span>
                  Energy wave detected
                </motion.div>
              )}

              {/* Typing */}
              {typing.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-zinc-600 flex items-center gap-2 mt-1"
                >
                  <div className="typing-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  {typing.join(', ')} yozmoqda...
                </motion.div>
              )}
            </>
          )}
          <div ref={msgEnd} />
        </div>

        {/* AI Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/[0.04]"
            >
              <div className="px-3 md:px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleSuggestion(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#FFDE02]/10 hover:text-[#FFDE02] border border-white/10 text-xs text-zinc-400 whitespace-nowrap transition-all flex-shrink-0"
                  >
                    <span>{s.emoji}</span>
                    <span>{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scroll to bottom */}
        {showScrollDown && (
          <button
            onClick={() => msgEnd.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-20 right-4 md:right-8 z-10 w-9 h-9 rounded-full bg-[#FFDE02] flex items-center justify-center text-black shadow-lg hover:bg-white transition-all animate-scale-in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        )}

        {/* Reply / Edit bar */}
        {(replyTo || editingMsg) && (
          <div className="px-3 md:px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center gap-2">
            <div className={`w-0.5 h-8 rounded-full flex-shrink-0 ${editingMsg ? 'bg-blue-500' : 'bg-[#FFDE02]'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-semibold ${editingMsg ? 'text-blue-400' : 'text-[#FFDE02]'}`}>
                {editingMsg ? 'Xabarni tahrirlash' : `${replyTo?.fromName} ga javob`}
              </p>
              <p className="text-xs text-zinc-500 truncate">
                {editingMsg?.text || replyTo?.text || (replyTo?.media?.startsWith('data:audio') ? '🎤 Ovozli xabar' : replyTo?.media ? '📷 Rasm' : '')}
              </p>
            </div>
            <button
              onClick={() => { setReplyTo(null); setEditingMsg(null) }}
              className="p-1 rounded hover:bg-white/10 text-zinc-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        )}

        {/* Input */}
        <InputArea
          text={text}
          setText={setText}
          media={media}
          setMedia={setMedia}
          recording={recording}
          recTime={recTime}
          transcribing={transcribing}
          onSend={handleSend}
          onToggleRecord={toggleRecording}
          onSpeechToText={handleSpeechToText}
          onFilePick={async f => setMedia(await readFile(f))}
          focusKey={replyTo?.id}
        />
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onPrev={lightbox.index > 0 ? () => setLightbox(l => l ? { ...l, index: l.index - 1 } : null) : undefined}
          onNext={lightbox.index < lightbox.images.length - 1 ? () => setLightbox(l => l ? { ...l, index: l.index + 1 } : null) : undefined}
        />
      )}

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          user={user}
          open={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={updated => setUser(updated)}
        />
      )}
    </main>
  )
}
