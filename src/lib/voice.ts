// ─── VOICE RECORDING ───

let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let stream: MediaStream | null = null

export type VoiceState = 'idle' | 'recording' | 'playing'

export async function startRecording(): Promise<void> {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    audioChunks = []

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }

    mediaRecorder.start()
  } catch (e) {
    console.error('Microphone access denied:', e)
    throw new Error('Mikrofonga ruxsat berilmagan')
  }
}

export function stopRecording(): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) return reject('No recording')

    mediaRecorder.onstop = () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
        stream = null
      }
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      audioChunks = []
      resolve(blob)
    }

    mediaRecorder.stop()
  })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function playAudio(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(base64)
    audio.onended = () => resolve()
    audio.onerror = reject
    audio.play().catch(reject)
  })
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── VOICE-TO-TEXT (Web Speech API) ───
const SpeechRecognition = (typeof window !== 'undefined') &&
  ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)

export function isSpeechSupported(): boolean {
  return !!SpeechRecognition
}

export function speechToText(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) return reject('Speech recognition not supported')

    const recognition = new SpeechRecognition()
    recognition.lang = 'uz-UZ'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e: any) => {
      resolve(e.results[0][0].transcript)
    }

    recognition.onerror = () => reject('Ovoz tushunilmadi')
    recognition.start()
  })
}
