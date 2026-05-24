'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smile } from 'lucide-react'

const EMOJIS = [
  ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗'],
  ['🤔','🤗','🤭','🫢','🫣','🤫','😶','😐','😑','😒','🙄','😬','😮','😲','🥺','😢'],
  ['😤','😡','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','🎃'],
  ['👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌'],
  ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖'],
  ['🔥','⭐','✨','💫','🌟','⚡','💥','🌈','🌊','🍀','🎯','🎉','🎊','🎈','💯','✅'],
  ['🐱','🐶','🐺','🐸','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧'],
  ['🍕','🍔','🌮','🌯','🥗','🥙','🍣','🍜','🍝','🍰','🎂','🍦','🍩','🍪','☕','🍺'],
  ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🏸','🥊','🥋','⛸️','🎿','🏂','🚴'],
  ['🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🚚','🚛','🛵','🏍️','✈️','🚀'],
]

interface Props {
  onEmoji: (emoji: string) => void
}

export default function EmojiPicker({ onEmoji }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl glass-hover flex items-center justify-center flex-shrink-0"
        title="Emoji"
      >
        <Smile size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-12 left-0 z-30 glass-strong rounded-2xl p-3 shadow-2xl"
          >
            <div className="w-[280px] h-[200px] overflow-y-auto scrollbar-hide">
              {EMOJIS.map((row, ri) => (
                <div key={ri} className="flex gap-0.5 mb-0.5">
                  {row.map((e) => (
                    <button
                      key={e}
                      onClick={() => { onEmoji(e); setOpen(false) }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
