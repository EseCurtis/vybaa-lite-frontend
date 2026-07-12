export type RewindPersonaId = 'ella' | 'lyra' | 'jake' | 'ariel'

export type RewindPersona = {
  id: RewindPersonaId
  name: string
  emoji: string
  perspective: string
  welcome: string
}

export const REWIND_PERSONAS: Array<RewindPersona> = [
  {
    id: 'ella',
    name: 'Ella',
    emoji: '🌸',
    perspective: 'Notices feelings beneath the surface',
    welcome: 'A gentle space to hear what your day felt like.',
  },
  {
    id: 'lyra',
    name: 'Lyra',
    emoji: '🌙',
    perspective: 'Sees patterns, meaning, and quiet shifts',
    welcome: 'Step back and notice what your day may be showing you.',
  },
  {
    id: 'jake',
    name: 'Jake',
    emoji: '⚡',
    perspective: 'Spots decisions, momentum, and next moves',
    welcome: 'Talk it through clearly and leave with what matters.',
  },
  {
    id: 'ariel',
    name: 'Ariel',
    emoji: '🌊',
    perspective: 'Finds resilience, balance, and possibility',
    welcome: 'Unwind the day and reconnect with your steadier side.',
  },
]

export function getRewindPersona(personaId: RewindPersonaId): RewindPersona {
  const persona = REWIND_PERSONAS.find((p) => p.id === personaId)
  if (!persona) throw new Error(`Unknown Rewind persona: ${personaId}`)
  return persona
}
