import { describe, expect, it } from 'vitest'

import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

import {
  formatRewindContextualGreeting,
  randomRewindGreetings,
  resolveRewindHomePersona,
} from './home.util.shared'

const PERSONA_IDS: readonly RewindPersonaId[] = [
  'ella',
  'lyra',
  'jake',
  'ariel',
  'tobi',
  'neeja',
]

describe('Rewind home greetings', () => {
  it('keeps the selected profile partner ahead of stale contextual data', () => {
    expect(resolveRewindHomePersona('jake', 'ella')).toBe('jake')
    expect(resolveRewindHomePersona(null, 'lyra')).toBe('lyra')
    expect(resolveRewindHomePersona(undefined, null)).toBe('ella')
  })

  it('gives each partner distinct rotating copy', () => {
    const greetings = PERSONA_IDS.map((personaId) =>
      randomRewindGreetings(personaId, 'Ese', Date.UTC(2026, 8, 5, 12)),
    )
    const messages = greetings.map(([title, message]) => `${title} ${message}`)

    expect(new Set(messages).size).toBe(PERSONA_IDS.length)
    expect(messages[0]).toMatch(/🥺|😭|feeling|talk/i)
    expect(messages[1]).toMatch(
      /lol|vibing|no big speech|cool|situation|survived/i,
    )
    expect(messages[2]).toMatch(/honest|excuses|truth|problem|avoiding|drag/i)
    expect(messages[3]).toMatch(/kid|checking|one thing|sort|holding|carry/i)
    expect(messages[4]).toMatch(/gist|alive|hanging|how far|oya|saying/i)
    expect(messages[5]).toMatch(/mind|quiet|story|check|noticed|side/i)
  })

  it('revoices the same context for the selected partner', () => {
    const sourceMessage = 'Ese, you protected your time today.'
    const messages = PERSONA_IDS.map((personaId) =>
      formatRewindContextualGreeting(personaId, 'Ese', sourceMessage),
    )

    expect(messages).toEqual([
      'wait Ese 🥺 you protected your time today',
      'Ese, you protected your time today. anyway 🙂',
      'Ese, straight up: you protected your time today.',
      "hey Ese, you protected your time today. i'm here if u need me",
      'yo Ese, you protected your time today 😂',
      'Ese, you protected your time today... tell me more 🤎',
    ])
    expect(messages.every((message) => message.length <= 100)).toBe(true)
  })

  it('keeps long contextual greetings within the home card limit', () => {
    const message = formatRewindContextualGreeting(
      'ariel',
      'Ese',
      `Ese, ${'a difficult but important pattern '.repeat(8)}`,
    )

    expect(message.length).toBeLessThanOrEqual(100)
    expect(message).toMatch(/^hey Ese, /)
    expect(message).toMatch(/i'm here if u need me$/)
  })
})
