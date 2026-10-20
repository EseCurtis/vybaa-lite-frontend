import { REWIND_PERSONAS } from './rewind-personas'
import type { RewindPersonaId } from './rewind-personas'

export const PARTNER_EMOTIONS = [
  'thinking',
  'typing',
  'love',
  'laughing',
  'surprised',
  'listening',
  'skeptical',
  'cheering',
] as const
export type PartnerEmotion = (typeof PARTNER_EMOTIONS)[number]
export type PartnerEmoji = {
  partnerId: RewindPersonaId
  emotion: PartnerEmotion
}

export function partnerEmojiAsset({
  partnerId,
  emotion,
}: PartnerEmoji): string {
  return `/assets/rewind/expressions/v2-detached-heads/${partnerId}/${emotion}.webp`
}

export function partnerEmojiToken({
  partnerId,
  emotion,
}: PartnerEmoji): string {
  return `:vybaa/${partnerId}/${emotion}:`
}

export function parsePartnerEmoji(value: string): PartnerEmoji | null {
  const match = /^:vybaa\/([a-z]+)\/([a-z]+):$/.exec(value)
  if (!match) return null
  const partner = REWIND_PERSONAS.find((item) => item.id === match[1])
  const emotion = PARTNER_EMOTIONS.find((item) => item === match[2])
  return partner && emotion ? { partnerId: partner.id, emotion } : null
}

export function messageEmojiEmotion(value: string): PartnerEmotion | null {
  const emotions: Record<string, PartnerEmotion> = {
    '❤️': 'love',
    '❤': 'love',
    '🥰': 'love',
    '😍': 'love',
    '😂': 'laughing',
    '🤣': 'laughing',
    '🤔': 'thinking',
    '😮': 'surprised',
    '😲': 'surprised',
    '😱': 'surprised',
    '🤨': 'skeptical',
    '🙌': 'cheering',
    '🎉': 'cheering',
  }
  return emotions[value] ?? null
}

export const PARTNER_EMOJI_PATTERN =
  /(:vybaa\/[a-z]+\/[a-z]+:|❤️|❤|🥰|😍|😂|🤣|🤔|😮|😲|😱|🤨|🙌|🎉)/gu
