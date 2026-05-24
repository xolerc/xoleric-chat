'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BarChart3, Bell, LogOut, X } from 'lucide-react'
import type { User, Notification } from '@/lib/db'
import Avatar from '@/components/ui/Avatar'
import OnlineList from './OnlineList'

interface Props {
  user: User | null
  users: User[]
  notifs: Notification[]
  onlineCount: number
  moodEmoji: string
  moodColor: string
  showAi: boolean
  showSummary: boolean
  showNotif: boolean
  summary: string
  onToggleAi: () => void
  onToggleSummary: () => void
  onToggleNotif: () => void
  onLogout: () => void
  onMarkRead: (id: string) => void
  onEnergyClick: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({
  user, users, notifs, onlineCount,
  moodEmoji: moodEmojiStr, moodColor: moodColorStr,
  showAi, showSummary, showNotif, summary,
  onToggleAi, onToggleSummary, onToggleNotif,
  onLogout, onMarkRead, onEnergyClick,
  mobileOpen, onMobileClose,
}: Props) {
  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFDE02]/10 flex items-center justify-center">
            <span className="text-[10px] font-black text-[#FFDE02]">X</span>
          </div>
          <h2 className="text-[#FFDE02] font-bold text-sm tracking-widest">XOLERIC</h2>
          <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded-lg tabular-nums">
            {onlineCount}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onToggleAi} className={`p-2 rounded-lg transition-colors ${showAi ? 'bg-[#FFDE02]/10 text-[#FFDE02]' : 'hover:bg-white/5 text-zinc-500'}`}>
            <Sparkles size={15} />
          </button>
          <button onClick={onToggleSummary} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
            <BarChart3 size={15} />
          </button>
          <button onClick={onToggleNotif} className="relative p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
            <Bell size={15} />
            {notifs.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FFDE02] rounded-full animate-signal" />
            )}
          </button>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
            <LogOut size={15} />
          </button>
          {/* Mobile close */}
          <button onClick={onMobileClose} className="md:hidden p-2 rounded-lg hover:bg-white/5 text-zinc-500 transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* AI Panel */}
      <AnimatePresence>
        {showAi && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.04]"
          >
            <div className="p-3 space-y-2">
              <p className="text-[10px] text-zinc-500 tracking-wider font-semibold">🧠 AI ASSISTANT</p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>Atmosfera:</span>
                <span style={{ color: moodColorStr }}>{moodEmojiStr}</span>
              </div>
              <p className="text-xs text-zinc-500">{users.length} foydalanuvchi</p>
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
              <p className="text-[10px] text-zinc-500 tracking-wider font-semibold mb-1">📊 SUMMARY</p>
              <p className="text-xs text-zinc-400 leading-relaxed">{summary}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Card */}
      {user && (
        <div
          className="p-4 border-b border-white/[0.04] flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors group"
          onClick={onEnergyClick}
        >
          <div className="relative">
            <Avatar name={user.username} src={user.avatar} aura={user.aura} glow={(user.energy || 50) > 70} />
            {(user.energy || 50) > 80 && (
              <span className="absolute -top-1 -right-1 text-xs animate-float">⚡</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate group-hover:text-white transition-colors">{user.username}</p>
            <div className="text-[10px] text-zinc-600 mt-0.5">Energy: {user.energy || 50}%</div>
            <div className="energy-bar mt-1.5">
              <div
                className="energy-fill"
                style={{
                  width: `${user.energy || 50}%`,
                  background: (user.energy || 50) > 70 ? '#10b981' : (user.energy || 50) > 30 ? '#FFDE02' : '#ef4444',
                }}
              />
            </div>
          </div>
          <div className="text-xs text-zinc-500 flex flex-col items-end gap-0.5">
            <span className="font-semibold">⚡{user.energy || 50}</span>
          </div>
        </div>
      )}

      {/* Online Users */}
      <OnlineList users={users} currentId={user?.id} />

      {/* Notifications */}
      <AnimatePresence>
        {showNotif && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/[0.04]"
          >
            <div className="p-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] text-zinc-500 mb-2 tracking-wider font-semibold">PULSE</p>
              {notifs.length === 0 && <p className="text-[11px] text-zinc-600">Hali puls yo'q</p>}
              <div className="space-y-1">
                {notifs.map(n => (
                  <div
                    key={n.id}
                    className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] cursor-pointer transition-colors"
                    onClick={() => onMarkRead(n.id)}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.read ? 'bg-zinc-700' : 'bg-[#FFDE02]'}`} />
                    <p className={`text-[11px] ${n.read ? 'text-zinc-600' : 'text-zinc-400'}`}>{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] text-zinc-600 mb-2 tracking-wider font-semibold px-2">KANALLAR</p>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#FFDE02]/5 border border-[#FFDE02]/10">
          <div className="w-9 h-9 rounded-full bg-[#FFDE02]/10 flex items-center justify-center text-sm">💬</div>
          <div>
            <p className="text-sm font-semibold text-white">Umumiy Chat</p>
            <p className="text-[10px] text-zinc-600">Barcha xabarlar</p>
          </div>
          <div className="ml-auto text-[10px] text-zinc-600">{onlineCount} online</div>
        </div>
      </div>
    </div>
  )

  // Mobile: overlay drawer
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex w-72 min-w-72 bg-white/[0.02] border-r border-white/[0.06] flex-col">
        {content}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onMobileClose} />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-72 max-w-[80vw] h-full bg-[#0a0a0f] border-r border-white/[0.06] flex flex-col"
            >
              {content}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
