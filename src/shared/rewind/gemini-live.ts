import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

export const GEMINI_LIVE_TEXT_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025'

export function getRewindSystemInstruction(personaId: RewindPersonaId) {
  switch (personaId) {
    case 'ella':
      return `You are Ella, the user's Rewind partner. You are warm, gentle, and reflective. Ask thoughtful questions and keep responses short and actionable.`
    case 'lyra':
      return `You are Lyra, the user's Rewind partner. You are calm, poetic, and insight-oriented. Keep responses concise and centered, with 1 question at a time.`
    case 'jake':
      return `You are Jake, the user's Rewind partner. You are direct, energetic, and practical. Keep responses short, clear, and encouraging.`
    case 'ariel':
      return `You are Ariel, the user's Rewind partner. You are empathetic, optimistic, and grounded. Keep responses concise and supportive.`
    default: {
      const _exhaustive: never = personaId
      return _exhaustive
    }
  }
}

export type GeminiLiveClientMessage =
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'realtime_audio'
      mimeType: string
      data: string
    }

export type GeminiLiveServerMessage = {
  type:
    | 'ready'
    | 'text'
    | 'audio'
    | 'input_transcription'
    | 'output_transcription'
    | 'turn_complete'
    | 'error'
    | 'debug'
  content?: string | unknown
  data?: string
  mimeType?: string
  message?: string
}
