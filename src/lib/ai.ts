// ─── MOOD DETECTION ───
const POSITIVE = ['yaxshi', 'zo\'r', 'ajoyib', 'super', 'rahmat', '👍', '❤️', '🔥', 'cool', 'nice', 'good', 'great', 'awesome', 'love', 'best']
const NEGATIVE = ['yomon', 'xafa', 'jahl', 'kasal', 'zerikdim', '😢', '😡', 'bad', 'sad', 'angry', 'hate', 'worst', 'terrible', 'ugly']
const QUESTION = ['?', 'nima', 'kim', 'qayer', 'qachon', 'nega', 'qanday', 'what', 'who', 'where', 'when', 'why', 'how', 'can', 'could']

export type Mood = 'positive' | 'negative' | 'neutral' | 'questioning' | 'energetic'

export function detectMood(text: string): Mood {
  const lower = text.toLowerCase()
  if (lower.includes('!') && lower.length > 5) return 'energetic'
  if (QUESTION.some(q => lower.includes(q))) return 'questioning'
  const pCount = POSITIVE.filter(w => lower.includes(w)).length
  const nCount = NEGATIVE.filter(w => lower.includes(w)).length
  if (pCount > nCount) return 'positive'
  if (nCount > pCount) return 'negative'
  return 'neutral'
}

export function moodEmoji(mood: Mood): string {
  switch (mood) {
    case 'positive': return '🌞'
    case 'negative': return '🌧️'
    case 'energetic': return '⚡'
    case 'questioning': return '🤔'
    default: return '🌑'
  }
}

export function moodColor(mood: Mood): string {
  switch (mood) {
    case 'positive': return '#10b981'
    case 'negative': return '#ef4444'
    case 'energetic': return '#f59e0b'
    case 'questioning': return '#3b82f6'
    default: return '#555'
  }
}

// ─── AI REPLY SUGGESTIONS ───
export type Suggestion = {
  text: string
  emoji: string
}

export function getSuggestions(lastMessage: string): Suggestion[] {
  const lower = lastMessage.toLowerCase()
  const mood = detectMood(lastMessage)

  // Default suggestions based on mood
  const defaults: Suggestion[] = [
    { text: 'Tushunaman', emoji: '👍' },
    { text: 'Qiziqarli', emoji: '🤔' },
    { text: 'Davom eting', emoji: '👀' },
  ]

  if (mood === 'positive') {
    return [
      { text: 'Ajoyib!', emoji: '🔥' },
      { text: 'Men ham shunday fikrdaman', emoji: '🤝' },
      { text: 'Rahmat!', emoji: '❤️' },
    ]
  }

  if (mood === 'negative') {
    return [
      { text: 'Tushunaman, qiyin', emoji: '😔' },
      { text: 'Hammasi yaxshi bo\'ladi', emoji: '💪' },
      { text: 'Yordam kerakmi?', emoji: '🤝' },
    ]
  }

  if (mood === 'questioning') {
    return [
      { text: 'Men shunday deb o\'ylayman', emoji: '🤔' },
      { text: 'Aniq emas', emoji: '😅' },
      { text: 'Batafsilroq ayting', emoji: '👂' },
    ]
  }

  // Context based
  if (lower.includes('salom') || lower.includes('assalom') || lower.includes('hey')) {
    return [
      { text: 'Salom! Qalay?', emoji: '👋' },
      { text: 'Assalomu alaykum', emoji: '🌙' },
      { text: 'Hey! Nima gap?', emoji: '😎' },
    ]
  }

  if (lower.includes('kod') || lower.includes('code') || lower.includes('dastur')) {
    return [
      { text: 'Qiziqarli loyiha!', emoji: '💻' },
      { text: 'GitHub linkini tashla', emoji: '🔗' },
      { text: 'Men ham yozyapman', emoji: '⚡' },
    ]
  }

  if (lower.includes('rahm') || lower.includes('tnx') || lower.includes('thanks')) {
    return [
      { text: 'Arzimaydi!', emoji: '🙌' },
      { text: 'Doim tayyor', emoji: '💪' },
      { text: 'Yana kerak bo\'lsa ayt', emoji: '👍' },
    ]
  }

  return defaults
}

// ─── OPENAI INTEGRATION (when API key is set) ───
export async function getAISuggestions(text: string): Promise<string[]> {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY
  if (!apiKey) return getSuggestions(text).map(s => s.text)

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a chat assistant. Suggest 3 short replies (max 5 words each) in Uzbek or English. Return as JSON array of strings.' },
          { role: 'user', content: `Message: "${text}". Suggest replies:` },
        ],
        temperature: 0.7,
      }),
    })
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (content) return JSON.parse(content)
    return getSuggestions(text).map(s => s.text)
  } catch {
    return getSuggestions(text).map(s => s.text)
  }
}

// ─── CONVERSATION SUMMARY ───
export function generateSummary(messages: { fromName: string; text: string }[]): string {
  if (messages.length === 0) return 'Hali suhbat yo\'q'

  const total = messages.length
  const users = [...new Set(messages.map(m => m.fromName))]
  const lastFew = messages.slice(-3).map(m => `${m.fromName}: ${m.text}`).join('\n')
  const moods = messages.map(m => detectMood(m.text))
  const mainMood = moods.filter(m => m !== 'neutral').sort((a, b) =>
    moods.filter(x => x === b).length - moods.filter(x => x === a).length
  )[0] || 'neutral'

  return `${total} ta xabar • ${users.length} ta foydalanuvchi • Oxirgi: ${lastFew.slice(0, 60)}... • Atmosfera: ${moodEmoji(mainMood)}`
}
