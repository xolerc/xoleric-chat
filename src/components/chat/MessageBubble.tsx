'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Message } from '@/lib/db'
import { detectMood, moodEmoji } from '@/lib/ai'
import { timeAgo, getColor } from '@/lib/db'
import { Volume2, Trash2, Reply } from 'lucide-react'

const REACTIONS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '⚡']

interface Props {
  msg: Message
  isOwn: boolean
  playing: string | null
  messages: Message[]
  onPlayVoice: (b64: string) => void
  onReact: (msgId: string, emoji: string) => void
  onDelete?: (msgId: string) => void
  onImageClick?: (src: string) => void
  onReply?: (msg: Message) => void
}

export default function MessageBubble({ msg, isOwn, playing, messages, onPlayVoice, onReact, onDelete, onImageClick, onReply }: Props) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const isVoice = msg.media?.startsWith('data:audio')
  const mood = detectMood(msg.text)
  const color = getColor(msg.fromName)

  const replyMsg = msg.replyTo ? messages.find(m => m.id === msg.replyTo) : null
  const replyColor = replyMsg ? getColor(replyMsg.fromName) : '#555'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group"
    >
      <div className={`flex gap-2.5 max-w-[85%] md:max-w-[75%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1"
          style={{ background: `${color}20`, color }}
        >
          {msg.fromName?.charAt(0).toUpperCase() || '?'}
        </div>

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
            className={`rounded-2xl px-3.5 py-2.5 relative ${
              isOwn
                ? 'bg-[#FFDE02]/10 rounded-tr-md'
                : 'bg-white/[0.04] rounded-tl-md'
            }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            {/* Reply preview */}
            {replyMsg && (
              <div
                className="mb-2 pl-3 border-l-2 rounded-sm text-xs"
                style={{ borderColor: replyColor }}
              >
                <p className="font-semibold text-[10px]" style={{ color: replyColor }}>
                  {replyMsg.fromName}
                </p>
                <p className="text-zinc-500 truncate max-w-[200px]">
                  {replyMsg.text || (replyMsg.media ? '📷 Rasm' : '🎤 Ovoz')}
                </p>
              </div>
            )}

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
                  onClick={() => onImageClick?.(msg.media!)}
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
                  <div className="voice-wave">{[1,2,3,4,5].map(i => <span key={i} />)}</div>
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

            {/* Actions on hover: Reply + Reactions + Delete */}
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`absolute -bottom-4 flex gap-0.5 bg-[#0f0f14] border border-white/[0.08] rounded-full px-1.5 py-1 shadow-lg z-10 ${isOwn ? 'right-0' : 'left-0'}`}
              >
                {onReply && (
                  <button
                    onClick={() => { onReply(msg); setShowActions(false) }}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                    title="Javob berish"
                  >
                    <Reply size={11} className="text-zinc-400" />
                  </button>
                )}
                {REACTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => { onReact(msg.id, r); setShowActions(false) }}
                    className="w-6 h-6 flex items-center justify-center text-sm hover:scale-125 transition-transform rounded-full hover:bg-white/10"
                  >
                    {r}
                  </button>
                ))}
                {isOwn && onDelete && (
                  <button
                    onClick={() => { onDelete(msg.id); setShowActions(false) }}
                    className="w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 size={11} className="text-red-400" />
                  </button>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
