'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  getUser, getAllUsers, getMessages, sendMessage,
  subscribeMessages, getNotifications, markNotifRead,
  updateUser, Message, User, Notification,
  getColor, timeAgo, escHtml, incrementVisits,
} from '@/lib/db'
import { detectMood, moodEmoji, moodColor, getSuggestions, generateSummary, type Suggestion } from '@/lib/ai'
import { startRecording, stopRecording, blobToBase64, playAudio, isSpeechSupported, speechToText } from '@/lib/voice'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Send, Image, LogOut, Bell, Smile, X,
  Mic, MicOff, Volume2, Sparkles, BarChart3,
} from 'lucide-react'

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
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedMsg, setSelectedMsg] = useState<string | null>(null)
  const [recording, setRecording] = useState(false)
  const [playing, setPlaying] = useState<string | null>(null)
  const [recTime, setRecTime] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [typing, setTyping] = useState<string[]>([])
  const msgEnd = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const recTimer = useRef<NodeJS.Timeout | null>(null)
  const recStart = useRef(0)
  const [mood, setMood] = useState('neutral')

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

  // Mood detection on last message
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.fromId !== user?.id) {
      setMood(detectMood(last.text))
    }
  }, [messages, user])

  // Typing indicator
  useEffect(() => {
    if (!user) return
    const recent = messages
      .filter(m => m.fromId !== user.id)
      .filter(m => Date.now() - m.time < 5000)
      .map(m => m.fromName)
    setTyping([...new Set(recent)].slice(0, 3))
  }, [messages, user])

  // AI suggestions when text changes
  useEffect(() => {
    if (text.trim().length > 2) {
      setSuggestions(getSuggestions(text))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [text])

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
    setShowSuggestions(false)

    // Increase energy on send
    const newEnergy = Math.min(100, (user.energy || 50) + 2)
    setUser({ ...user, energy: newEnergy })
    await updateUser(user.id, { energy: newEnergy }).catch(() => {})
  }

  async function handleSuggestion(s: Suggestion) {
    if (!user) return
    await sendMessage({
      fromId: user.id, fromName: user.username,
      fromAvatar: user.avatar, text: s.text,
    })
    setShowSuggestions(false)
  }

  async function handleLogout() {
    if (user) await updateUser(user.id, { online: false }).catch(() => {})
    localStorage.removeItem('xolerc_uid')
    router.push('/auth')
  }

  // ─── VOICE ───
  async function toggleRecording() {
    if (recording) {
      try {
        const blob = await stopRecording()
        if (recTimer.current) clearInterval(recTimer.current)
        setRecording(false)
        setRecTime(0)
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
      } catch (e) {
        alert('Mikrofonga ruxsat berilmagan')
      }
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

  function playVoiceMsg(base64: string) {
    if (playing === base64) {
      setPlaying(null)
      return
    }
    setPlaying(base64)
    playAudio(base64).finally(() => setPlaying(null))
  }

  // Online users count
  const onlineUsers = users.filter(u => u.online)
  const totalUsers = users.length

  return (
    <main className="h-screen flex bg-[#050505]">
      {/* Sidebar */}
      <aside className="w-72 min-w-72 bg-white/[0.02] border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[#FFDE02] font-bold text-sm tracking-widest">XOLERIC</h2>
            <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{onlineUsers.length}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowAiPanel(!showAiPanel)} className={`p-2 rounded-lg transition-colors ${showAiPanel ? 'bg-[#FFDE02]/10 text-[#FFDE02]' : 'hover:bg-white/5 text-zinc-500'}`}>
              <Sparkles size={16} />
            </button>
            <button onClick={() => setShowSummary(!showSummary)} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
              <BarChart3 size={16} />
            </button>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
              <Bell size={16} />
              {notifs.filter(n => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFDE02] rounded-full animate-signal" />
              )}
            </button>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* AI Panel */}
        <AnimatePresence>
          {showAiPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/[0.04]"
            >
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-zinc-500 tracking-wider">🧠 AI ASSISTANT</p>
                <p className="text-xs text-zinc-400">
                  Atmosfera: {moodEmoji(mood as any)} {mood}
                </p>
                <p className="text-xs text-zinc-500">{totalUsers} foydalanuvchi • {messages.length} xabar</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary */}
        <AnimatePresence>
          {showSummary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/[0.04]"
            >
              <div className="p-3">
                <p className="text-[10px] text-zinc-500 tracking-wider mb-1">📊 SUMMARY</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {generateSummary(messages.slice(-20).map(m => ({ fromName: m.fromName, text: m.text })))}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User card */}
        {user && (
          <motion.div
            className="p-4 border-b border-white/[0.04] flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
            whileHover={{ x: 2 }}
            onClick={() => {
              // Quick energy boost
              const e = Math.min(100, (user.energy || 50) + 5)
              setUser({ ...user, energy: e })
              updateUser(user.id, { energy: e }).catch(() => {})
            }}
          >
            <div className="relative">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 animate-pulse-glow"
                style={{
                  '--aura-color': user.aura || '#FFDE02',
                  background: user.avatar ? `url(${user.avatar}) center/cover` : `${getColor(user.username)}20`,
                  color: getColor(user.username),
                } as React.CSSProperties}
              >
                {user.avatar ? '' : user.username.charAt(0).toUpperCase()}
              </div>
              {(user.energy || 50) > 80 && (
                <span className="absolute -top-1 -right-1 text-xs animate-float">⚡</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{user.username}</p>
              <div className="energy-bar mt-1">
                <div
                  className="energy-bar-fill"
                  style={{
                    width: `${user.energy || 50}%`,
                    background: (user.energy || 50) > 70 ? '#10b981' : (user.energy || 50) > 30 ? '#FFDE02' : '#ef4444',
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-zinc-500 flex flex-col items-end">
              <span>⚡{user.energy || 50}</span>
              <span className="text-[10px]" style={{ color: moodColor(mood as any) }}>{moodEmoji(mood as any)}</span>
            </div>
          </motion.div>
        )}

        {/* Online users */}
        <div className="p-3 border-b border-white/[0.04]">
          <p className="text-[10px] text-zinc-500 mb-2 tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-signal" />
            ONLINE — {onlineUsers.length}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {onlineUsers.slice(0, 10).map(u => (
              <div key={u.id} className="flex flex-col items-center gap-0.5 min-w-0 group">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: `${getColor(u.username)}20`, color: getColor(u.username) }}
                >
                  {u.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-[9px] text-zinc-600 truncate max-w-[40px]">{u.username}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-white/[0.04]"
            >
              <div className="p-3 max-h-32 overflow-y-auto">
                <p className="text-[10px] text-zinc-500 mb-1 tracking-wider">PULSE</p>
                {notifs.length === 0 && <p className="text-[11px] text-zinc-600">Hali puls yo'q</p>}
                {notifs.map(n => (
                  <div key={n.id} className="flex items-start gap-2 py-1" onClick={() => markNotifRead(n.id)}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${n.read ? 'bg-zinc-700' : 'bg-[#FFDE02]'}`} />
                    <p className="text-[11px] text-zinc-400">{n.text}</p>
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
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-base">💬</div>
          <div>
            <h3 className="text-sm font-bold">Umumiy Chat</h3>
            <p className="text-[11px] text-zinc-500">{onlineUsers.length} online • {messages.length} xabar</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span style={{ color: moodColor(mood as any) }}>Atmosfera: {moodEmoji(mood as any)}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-zinc-600 text-sm mb-2">Hali xabarlar yo'q</p>
              <p className="text-zinc-700 text-xs">Birinchi bo'ling! Signal yuboring ⚡</p>
            </div>
          )}
          {messages.map(m => {
            const own = user && m.fromId === user.id
            const isVoice = m.media?.startsWith('data:audio')
            const msgMood = detectMood(m.text)

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-2 max-w-[80%] ${own ? 'ml-auto flex-row-reverse' : ''}`}
                onMouseEnter={() => setSelectedMsg(m.id)}
                onMouseLeave={() => setSelectedMsg(null)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1"
                  style={{ background: `${getColor(m.fromName)}20`, color: getColor(m.fromName) }}
                >
                  {m.fromName.charAt(0).toUpperCase()}
                </div>
                <div className={`min-w-0 ${own ? 'items-end' : ''}`}>
                  <p className={`text-[10px] font-semibold mb-0.5 flex items-center gap-1 ${own ? 'justify-end' : ''}`}>
                    <span className={own ? 'text-[#FFDE02]' : 'text-zinc-500'}>{own ? 'Siz' : m.fromName}</span>
                    <span className="text-[9px]">{moodEmoji(detectMood(m.text))}</span>
                  </p>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 ${
                      own
                        ? 'bg-[#FFDE02]/10 rounded-tr-md'
                        : 'bg-white/5 rounded-tl-md'
                    }`}
                  >
                    {m.text && <p className="text-sm text-zinc-200 leading-relaxed">{m.text}</p>}
                    {m.media && !isVoice && (
                      <img
                        src={m.media}
                        alt="media"
                        className="mt-1.5 rounded-xl max-w-[220px] cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(m.media, '_blank')}
                      />
                    )}
                    {m.media && isVoice && (
                      <button
                        onClick={() => playVoiceMsg(m.media!)}
                        className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {playing === m.media ? (
                          <div className="voice-wave">
                            {[1,2,3,4,5].map(i => <span key={i} />)}
                          </div>
                        ) : (
                          <Volume2 size={16} className="text-[#FFDE02]" />
                        )}
                        <span className="text-xs text-zinc-400">{playing === m.media ? 'Playing...' : 'Ovozli xabar'}</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {m.reaction && <span className="text-sm">{m.reaction}</span>}
                      <span className="text-[9px] text-zinc-600">{timeAgo(m.time)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}

          {/* Mood wave */}
          {messages.length > 0 && messages[messages.length - 1]?.fromId !== user?.id && mood !== 'neutral' && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 mt-2 text-[10px] text-zinc-600"
            >
              <span className="text-xs">{moodEmoji(mood as any)}</span>
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
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {typing.join(', ')} yozmoqda...
            </motion.div>
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
              <div className="px-4 py-2 flex gap-2 overflow-x-auto">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSuggestion(s)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-[#FFDE02]/10 hover:text-[#FFDE02] border border-white/10 text-xs text-zinc-400 whitespace-nowrap transition-all"
                  >
                    <span>{s.emoji}</span>
                    <span>{s.text}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="p-4 border-t border-white/[0.06]">
          {media && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative inline-block mb-2"
            >
              {media.startsWith('data:audio') ? (
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                  <Volume2 size={16} className="text-[#FFDE02]" />
                  <span className="text-xs text-zinc-400">Ovozli xabar ({recTime}s)</span>
                  <button onClick={() => setMedia('')} className="ml-2 text-zinc-500 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <img src={media} alt="preview" className="h-16 rounded-lg" />
                  <button
                    onClick={() => setMedia('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </motion.div>
          )}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInput.current?.click()}
              className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:border-[#FFDE02] hover:text-[#FFDE02] transition-all flex-shrink-0"
            >
              <Image size={16} />
              <input ref={fileInput} type="file" accept="image/*,.gif" hidden onChange={async e => {
                const f = e.target.files?.[0]
                if (f) setMedia(await readFile(f))
                e.target.value = ''
              }} />
            </button>
            <button
              onClick={toggleRecording}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 ${
                recording
                  ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse'
                  : 'border-white/10 text-zinc-500 hover:border-[#FFDE02] hover:text-[#FFDE02]'
              }`}
            >
              {recording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            {recording && (
              <div className="flex items-center gap-2 bg-red-500/10 rounded-xl px-3 py-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">{Math.floor(recTime / 60)}:{(recTime % 60).toString().padStart(2, '0')}</span>
              </div>
            )}
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder={recording ? 'Yozilmoqda...' : 'Xabar yozing...'}
              rows={1}
              disabled={recording}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] resize-none max-h-32 disabled:opacity-40"
            />
            {isSpeechSupported() && text.trim().length === 0 && !recording && (
              <button
                onClick={handleSpeechToText}
                disabled={transcribing}
                className="w-9 h-9 rounded-xl border border-white/10 flex items-center justify-center text-zinc-500 hover:border-[#06b6d4] hover:text-[#06b6d4] transition-all flex-shrink-0 disabled:opacity-40"
              >
                <span className="text-xs">{transcribing ? '...' : '🎤'}</span>
              </button>
            )}
            <button
              onClick={handleSend}
              disabled={(!text.trim() && !media) || recording}
              className="w-9 h-9 rounded-xl bg-[#FFDE02] flex items-center justify-center text-black hover:bg-white transition-all disabled:opacity-30 flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
