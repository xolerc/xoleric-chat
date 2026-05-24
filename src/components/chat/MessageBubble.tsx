'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/lib/db'
import { detectMood, moodEmoji } from '@/lib/ai'
import { timeAgo, getColor } from '@/lib/db'
import { Volume2 } from 'lucide-react'

interface Props {
  msg: Message
  isOwn: boolean
  playing: string | null
  onPlayVoice: (b64: string) => void
  onReaction?: (msgId: string) => void
}

export default function MessageBubble({ msg, isOwn, playing, onPlayVoice }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const isVoice = msg.media?.startsWith('data:audio')
  const mood = detectMood(msg.text)
  const color = getColor(msg.fromName)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex gap-2.5 max-w-[85%] md:max-w-[75%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1"
        style={{ background: `${color}20`, color }}
      >
        {msg.fromName?.charAt(0).toUpperCase() || '?'}
      </div>

      {/* Content */}
      <div className={`min-w-0 max-w-full ${isOwn ? 'items-end' : ''}`}>
        {/* Name + Mood */}
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? 'justify-end' : ''}`}>
          <span className={`text-[10px] font-semibold ${isOwn ? 'text-[#FFDE02]' : 'text-zinc-500'}`}>
            {isOwn ? 'Siz' : msg.fromName}
          </span>
          <span className="text-[10px]">{moodEmoji(mood as any)}</span>
        </div>

        {/* Bubble */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 ${
            isOwn
              ? 'bg-[#FFDE02]/10 rounded-tr-md'
              : 'bg-white/[0.04] rounded-tl-md'
          }`}
        >
          {msg.text && (
            <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
              {msg.text}
            </p>
          )}

          {/* Image */}
          {msg.media && !isVoice && (
            <div className="mt-1.5 relative">
              {!imgLoaded && <div className="skeleton h-32 w-full rounded-xl" />}
              <img
                src={msg.media}
                alt="media"
                onLoad={() => setImgLoaded(true)}
                className={`max-w-[200px] md:max-w-[260px] rounded-xl cursor-pointer hover:opacity-90 transition-opacity ${imgLoaded ? 'block' : 'hidden'}`}
                onClick={() => window.open(msg.media, '_blank')}
              />
            </div>
          )}

          {/* Voice */}
          {msg.media && isVoice && (
            <button
              onClick={() => onPlayVoice(msg.media!)}
              className="flex items-center gap-2.5 mt-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              {playing === msg.media ? (
                <div className="voice-wave">
                  {[1, 2, 3, 4, 5].map(i => <span key={i} />)}
                </div>
              ) : (
                <Volume2 size={16} className="text-[#FFDE02]" />
              )}
              <span className="text-xs text-zinc-400">
                {playing === msg.media ? 'Playing...' : 'Ovozli xabar'}
              </span>
            </button>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 mt-1.5">
            {msg.reaction && <span className="text-sm">{msg.reaction}</span>}
            <span className="text-[9px] text-zinc-600">{timeAgo(msg.time)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
