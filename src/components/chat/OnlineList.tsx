'use client'

import type { User } from '@/lib/db'
import Avatar from '@/components/ui/Avatar'

interface Props {
  users: User[]
  currentId?: string
}

export default function OnlineList({ users, currentId }: Props) {
  const online = users.filter(u => u.id !== currentId && u.online)
  if (online.length === 0) return null

  return (
    <div className="px-3 py-3 border-b border-white/[0.04]">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-signal" />
        <span className="text-[10px] text-zinc-500 tracking-wider font-semibold">
          ONLINE — {online.length}
        </span>
      </div>
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5">
        {online.slice(0, 12).map(u => (
          <div key={u.id} className="flex flex-col items-center gap-1 min-w-0 group">
            <Avatar name={u.username} aura={u.aura} size={32} />
            <span className="text-[9px] text-zinc-600 truncate max-w-[36px] group-hover:text-zinc-400 transition-colors">
              {u.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
