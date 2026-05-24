'use client'

import { useRef, useState, useEffect } from 'react'
import { Send, ImageIcon, Mic, MicOff, Volume2, X } from 'lucide-react'
import { isSpeechSupported } from '@/lib/voice'
import EmojiPicker from './EmojiPicker'

interface Props {
  text: string
  setText: (v: string | ((prev: string) => string)) => void
  media: string
  setMedia: (v: string) => void
  recording: boolean
  recTime: number
  transcribing: boolean
  onSend: () => void
  onToggleRecord: () => void
  onSpeechToText: () => void
  onFilePick: (file: File) => void
}

export default function InputArea({
  text, setText, media, setMedia,
  recording, recTime, transcribing,
  onSend, onToggleRecord, onSpeechToText, onFilePick,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const [rows, setRows] = useState(1)

  useEffect(() => {
    if (textRef.current) {
      textRef.current.style.height = 'auto'
      const h = textRef.current.scrollHeight
      const max = 120
      textRef.current.style.height = Math.min(h, max) + 'px'
      setRows(Math.min(Math.floor(h / 22), 4))
    }
  }, [text])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
    <div className="p-3 md:p-4 border-t border-white/[0.06] bg-[#050505]">
      {/* Media Preview */}
      {media && (
        <div className="inline-flex items-center gap-2 mb-2 px-3 py-2 bg-white/5 rounded-xl animate-scale-in">
          {media.startsWith('data:audio') ? (
            <>
              <Volume2 size={14} className="text-[#FFDE02]" />
              <span className="text-xs text-zinc-400">Ovozli xabar ({recTime}s)</span>
            </>
          ) : (
            <div className="relative">
              <img src={media} alt="preview" className="h-12 rounded-lg" />
              <button
                onClick={() => setMedia('')}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          )}
          <button onClick={() => setMedia('')} className="ml-1 p-0.5 rounded hover:bg-white/10 text-zinc-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Image picker */}
        <button
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-xl glass-hover flex items-center justify-center flex-shrink-0"
          title="Rasm/GIF"
        >
          <ImageIcon size={16} />
          <input ref={fileRef} type="file" accept="image/*,.gif" hidden onChange={e => {
            const f = e.target.files?.[0]
            if (f) onFilePick(f)
            e.target.value = ''
          }} />
        </button>

        {/* Voice record */}
        <button
          onClick={onToggleRecord}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all ${
            recording
              ? 'bg-red-500/20 border-red-500 text-red-500'
              : 'glass-hover'
          }`}
          title={recording ? 'To\'xtatish' : 'Ovozli xabar'}
        >
          {recording ? <MicOff size={16} /> : <Mic size={16} />}
        </button>

        {/* Recording indicator */}
        {recording && (
          <div className="flex items-center gap-2 bg-red-500/10 rounded-xl px-3 py-2 animate-scale-in">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-400 font-medium tabular-nums">
              {Math.floor(recTime / 60)}:{(recTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}

        {/* Text input */}
        <textarea
          ref={textRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={recording ? 'Yozilmoqda...' : 'Xabar yozing...'}
          rows={1}
          disabled={recording}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#FFDE02] resize-none max-h-[120px] disabled:opacity-40 transition-colors"
          style={{ height: 'auto', minHeight: 38 }}
        />

        {/* Emoji */}
        {!recording && (
          <EmojiPicker onEmoji={e => setText(prev => prev + e)} />
        )}

        {/* Speech to text */}
        {isSpeechSupported() && text.length === 0 && !recording && (
          <button
            onClick={onSpeechToText}
            disabled={transcribing}
            className="w-9 h-9 rounded-xl glass-hover flex items-center justify-center flex-shrink-0 disabled:opacity-40"
            title="Ovoz matniga aylantirish"
          >
            <span className="text-sm">{transcribing ? '...' : '🎤'}</span>
          </button>
        )}

        {/* Send */}
        <button
          onClick={onSend}
          disabled={(!text.trim() && !media) || recording}
          className="w-9 h-9 rounded-xl bg-[#FFDE02] flex items-center justify-center text-black hover:bg-white transition-all disabled:opacity-30 flex-shrink-0"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
