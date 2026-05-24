const DB_URL = 'https://xoleric-9ad1b-default-rtdb.firebaseio.com'
const U = (path: string) => `${DB_URL}${path}`

async function fetchJSON(path: string, options?: RequestInit) {
  const res = await fetch(U(path), {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  return res.json()
}

export type User = {
  id: string
  username: string
  bio: string
  avatar: string
  aura: string
  energy: number
  created: number
  online: boolean
}

export type Message = {
  id: string
  fromId: string
  fromName: string
  fromAvatar: string
  text: string
  media: string
  time: number
  reaction?: string
  replyTo?: string
}

export type Notification = {
  id: string
  userId: string
  type: 'pulse' | 'message' | 'reaction'
  text: string
  time: number
  read: boolean
}

// ─── USERS ───
export async function createUser(data: Partial<User>): Promise<User> {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const user: User = {
    id, username: data.username || 'Anon', bio: data.bio || '',
    avatar: data.avatar || '', aura: randomAura(), energy: 50,
    created: Date.now(), online: true,
  }
  await fetchJSON(`/users/${id}.json`, { method: 'PUT', body: JSON.stringify(user) })
  return user
}

export async function getUser(id: string): Promise<User | null> {
  return fetchJSON(`/users/${id}.json`)
}

export async function updateUser(id: string, data: Partial<User>) {
  await fetchJSON(`/users/${id}.json`, { method: 'PATCH', body: JSON.stringify(data) })
}

export async function getAllUsers(): Promise<User[]> {
  const data = await fetchJSON('/users.json')
  if (!data) return []
  return Object.values(data) as User[]
}

export async function usernameExists(username: string): Promise<boolean> {
  const users = await getAllUsers()
  return users.some(u => u.username?.toLowerCase() === username.toLowerCase().trim())
}

// ─── MESSAGES ───
export async function getMessages(groupId = 'main'): Promise<Message[]> {
  const data = await fetchJSON(`/messages/${groupId}.json`)
  if (!data) return []
  return Object.entries(data)
    .map(([id, v]) => ({ id, ...(v as object) } as Message))
    .sort((a, b) => (a.time || 0) - (b.time || 0))
}

export async function sendMessage(msg: Partial<Message>) {
  const data = {
    fromId: msg.fromId || '', fromName: msg.fromName || 'Anon',
    fromAvatar: msg.fromAvatar || '', text: msg.text || '',
    media: msg.media || '', time: Date.now(), reaction: '',
  }
  await fetchJSON(`/messages/main.json`, {
    method: 'POST', body: JSON.stringify(data),
  })
}

export async function addReaction(msgId: string, reaction: string) {
  await fetchJSON(`/messages/main/${msgId}/reaction.json`, {
    method: 'PUT', body: JSON.stringify(reaction),
  })
}

// ─── NOTIFICATIONS ───
export async function addNotification(n: Partial<Notification>) {
  const data = {
    userId: n.userId || '', type: n.type || 'message',
    text: n.text || '', time: Date.now(), read: false,
  }
  await fetchJSON('/notifications.json', {
    method: 'POST', body: JSON.stringify(data),
  })
}

export async function getNotifications(): Promise<Notification[]> {
  const data = await fetchJSON('/notifications.json')
  if (!data) return []
  return Object.entries(data)
    .map(([id, v]) => ({ id, ...(v as object) } as Notification))
    .sort((a, b) => b.time - a.time)
}

export async function markNotifRead(id: string) {
  await fetchJSON(`/notifications/${id}/read.json`, {
    method: 'PUT', body: JSON.stringify(true),
  })
}

// ─── STATS ───
export async function getStats() {
  const data = await fetchJSON('/stats.json')
  return { visits: data?.visits || 0, comments: data?.comments || 0 }
}

export async function incrementVisits() {
  if (typeof window !== 'undefined' && sessionStorage.getItem('xv')) return
  if (typeof window !== 'undefined') sessionStorage.setItem('xv', '1')
  const n = await fetchJSON('/stats/visits.json')
  await fetchJSON('/stats/visits.json', {
    method: 'PUT', body: JSON.stringify((n || 0) + 1),
  })
}

export function subscribeMessages(callback: (msgs: Message[]) => void) {
  let last = ''
  const poll = async () => {
    try {
      const msgs = await getMessages('main')
      const key = JSON.stringify(msgs.map(m => m.id + (m.text || '') + (m.media || '') + (m.reaction || '')))
      if (key !== last) { last = key; callback(msgs) }
    } catch {}
  }
  poll()
  const int = setInterval(poll, 1500)
  return () => clearInterval(int)
}

// ─── HELPERS ───
export function randomAura() {
  const auras = ['#FFDE02', '#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#ef4444']
  return auras[Math.floor(Math.random() * auras.length)]
}

export function getColor(name: string): string {
  const colors = ['#FFDE02','#06b6d4','#7c3aed','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6']
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'hozir'
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`
  const h = Math.floor(m / 60); if (h < 24) return `${h}s`
  const d = Math.floor(h / 24); if (d < 30) return `${d}k`
  return new Date(ts).toLocaleDateString('uz-UZ')
}

export function escHtml(s: string): string {
  if (typeof document === 'undefined') return s
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML
}
