import { describe, expect, it } from 'vitest'

import type { RewindChatReaction } from '@/shared/api/rewind.api'

import {
  getRewindChatReactionActorLabel,
  getRewindChatReactionEmoji,
} from './rewind-chat-reactions.util'

describe('Rewind chat reaction labels', () => {
  it('names the user and every reacting partner', () => {
    const reactions: RewindChatReaction[] = [
      { actor: 'USER', kind: 'LOVE', personaId: null },
      { actor: 'PARTNER', kind: 'LAUGH', personaId: 'ella' },
      { actor: 'PARTNER', kind: 'CRY', personaId: 'lyra' },
      { actor: 'PARTNER', kind: 'LIKE', personaId: 'jake' },
      { actor: 'PARTNER', kind: 'LOVE', personaId: 'ariel' },
    ]

    expect(reactions.map(getRewindChatReactionActorLabel)).toEqual([
      'You',
      'Ella',
      'Lyra',
      'Jake',
      'Ariel',
    ])
  })

  it('maps only the four supported reactions to their emoji', () => {
    const kinds = ['LOVE', 'LAUGH', 'CRY', 'LIKE'] as const
    expect(kinds.map(getRewindChatReactionEmoji)).toEqual([
      '❤️',
      '😂',
      '😭',
      '👍',
    ])
  })
})
