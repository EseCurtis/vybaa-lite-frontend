export type RewindPersonaId = 'ella' | 'lyra' | 'jake' | 'ariel'

export type RewindPersona = {
  id: RewindPersonaId
  name: string
  emoji: string
}

export const REWIND_PERSONAS: Array<RewindPersona> = [
  { id: 'ella', name: 'Ella', emoji: '🌸' },
  { id: 'lyra', name: 'Lyra', emoji: '🌙' },
  { id: 'jake', name: 'Jake', emoji: '⚡' },
  { id: 'ariel', name: 'Ariel', emoji: '🌊' },
]

export function getRewindPersona(personaId: RewindPersonaId) {
  const persona = REWIND_PERSONAS.find((p) => p.id === personaId)
  if (!persona) throw new Error(`Unknown Rewind persona: ${personaId}`)
  return persona
}

