export type RewindPersonaId = 'ella' | 'lyra' | 'jake' | 'ariel'
export type RewindPersonaIcon = 'emotion' | 'flashlight' | 'moon' | 'water'

export type RewindPersona = {
  avatar: string
  color: string
  id: RewindPersonaId
  icon: RewindPersonaIcon
  name: string
  perspective: string
  welcome: string
}

export const REWIND_PERSONAS: Array<RewindPersona> = [
  {
    avatar: '/assets/rewind/ella.png',
    color: '#C43D78',
    id: 'ella',
    icon: 'emotion',
    name: 'Ella',
    perspective: 'Feels things deeply and says what they stir up',
    welcome:
      'Bring the messy feelings. Ella will not pretend they are not there.',
  },
  {
    avatar: '/assets/rewind/lyra.png',
    color: '#5B4A9E',
    id: 'lyra',
    icon: 'moon',
    name: 'Lyra',
    perspective: 'Keeps it low-key and cuts through the drama',
    welcome: 'No big performance. Say what happened and let it breathe.',
  },
  {
    avatar: '/assets/rewind/jake.png',
    color: '#C9782A',
    id: 'jake',
    icon: 'flashlight',
    name: 'Jake',
    perspective: 'Says the uncomfortable truth without dressing it up',
    welcome: 'Expect the straight answer, even when it stings a little.',
  },
  {
    avatar: '/assets/rewind/ariel.png',
    color: '#2B9A8A',
    id: 'ariel',
    icon: 'water',
    name: 'Ariel',
    perspective: 'Shows up like the older sibling who has your back',
    welcome: 'Support, perspective, and a reality check when you need one.',
  },
]

export function getRewindPersona(personaId: RewindPersonaId): RewindPersona {
  const persona = REWIND_PERSONAS.find((p) => p.id === personaId)
  if (!persona) throw new Error(`Unknown Rewind persona: ${personaId}`)
  return persona
}
