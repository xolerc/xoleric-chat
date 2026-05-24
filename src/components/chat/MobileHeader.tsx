'use client'

import { Menu } from 'lucide-react'

interface Props {
  onlineCount: number
  messageCount: number
  moodEmoji: string
  onMenuClick: () => void
}

export default function MobileHeader({ onlineCount, messageCount, moodEmoji: emoji, onMenuClick }: Props) {
  return (
    <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-[#050505]">
      <button
        onClick={onMenuClick}
        className="w-8 h-8 rounded-lg glass-hover flex items-center justify-center flex-shrink-0"
      >
        <Menu size={16} />
      </button>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-[#FFDE02]/10 flex items-center justify-center text-sm flex-shrink-0">💬</div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold truncate">Umumiy Chat</h3>
          <p className="text-[10px] text-zinc-600">{onlineCount} online • {messageCount} xabar</p>
        </div>
      </div>
      <div className="ml-auto text-sm">{emoji}</div>
    </div>
  )
}
