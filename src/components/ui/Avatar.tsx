'use client'

import { getColor } from '@/lib/db'

interface Props {
  name: string
  src?: string
  size?: number
  aura?: string
  className?: string
  glow?: boolean
}

export default function Avatar({ name, src, size = 36, aura, className = '', glow }: Props) {
  const dim = typeof size === 'number' ? size : 36
  const color = getColor(name)

  return (
    <div
      className={`relative rounded-full flex items-center justify-center font-bold flex-shrink-0 ${glow ? 'animate-pulse-glow' : ''} ${className}`}
      style={{
        width: dim,
        height: dim,
        minWidth: dim,
        fontSize: Math.max(10, dim * 0.35),
        '--aura-color': aura || color,
        background: src ? `url(${src}) center/cover` : `${color}20`,
        color,
      } as React.CSSProperties}
    >
      {src ? null : name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  )
}
