import type {
  RewindChatReaction,
  RewindChatReactionKind,
} from '@/shared/api/rewind.api'

import { getRewindPersona } from './rewind-personas'

const REACTION_EMOJI: Record<RewindChatReactionKind, string> = {
  CRY: '😭',
  LAUGH: '😂',
  LIKE: '👍',
  LOVE: '❤️',
}

export function getRewindChatReactionActorLabel(
  reaction: RewindChatReaction,
): string {
  if (reaction.actor === 'USER') return 'You'
  if (reaction.personaId) return getRewindPersona(reaction.personaId).name
  return 'Partner'
}

export function getRewindChatReactionEmoji(
  kind: RewindChatReactionKind,
): string {
  return REACTION_EMOJI[kind]
}
