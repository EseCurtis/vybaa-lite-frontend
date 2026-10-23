import {
  PARTNER_EMOTIONS,
  parsePartnerEmoji,
  partnerEmojiToken,
} from './partner-emojis'
import type { PartnerEmoji } from './partner-emojis'
import { REWIND_PERSONAS } from './rewind-personas'

const RECENT_PARTNER_EMOJI_STORAGE_KEY = 'vybaa.rewind.recent-stickers.v1'
const MAX_RECENT_PARTNER_EMOJIS = 24

function readRecentPartnerEmojis(): PartnerEmoji[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = window.localStorage.getItem(RECENT_PARTNER_EMOJI_STORAGE_KEY)
    if (!stored) return []
    const values: unknown = JSON.parse(stored)
    if (!Array.isArray(values)) return []

    const seen = new Set<string>()
    return values
      .flatMap((value): PartnerEmoji[] => {
        if (typeof value !== 'string') return []
        const emoji = parsePartnerEmoji(value)
        if (!emoji) return []
        const token = partnerEmojiToken(emoji)
        if (seen.has(token)) return []
        seen.add(token)
        return [emoji]
      })
      .slice(0, MAX_RECENT_PARTNER_EMOJIS)
  } catch {
    return []
  }
}

export function sortPartnerEmojisByRecentUse(
  recent: readonly PartnerEmoji[] = readRecentPartnerEmojis(),
): PartnerEmoji[] {
  const allEmojis = REWIND_PERSONAS.flatMap((partner) =>
    PARTNER_EMOTIONS.map((emotion) => ({ partnerId: partner.id, emotion })),
  )
  const available = new Map(
    allEmojis.map((emoji) => [partnerEmojiToken(emoji), emoji]),
  )
  const sortedRecent: PartnerEmoji[] = []
  const seen = new Set<string>()

  for (const emoji of recent) {
    const token = partnerEmojiToken(emoji)
    const availableEmoji = available.get(token)
    if (!availableEmoji || seen.has(token)) continue
    sortedRecent.push(availableEmoji)
    seen.add(token)
  }

  return [
    ...sortedRecent,
    ...allEmojis.filter((emoji) => !seen.has(partnerEmojiToken(emoji))),
  ]
}

export function recordRecentPartnerEmoji(emoji: PartnerEmoji): PartnerEmoji[] {
  const nextRecent = [
    emoji,
    ...readRecentPartnerEmojis().filter(
      (recent) => partnerEmojiToken(recent) !== partnerEmojiToken(emoji),
    ),
  ].slice(0, MAX_RECENT_PARTNER_EMOJIS)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        RECENT_PARTNER_EMOJI_STORAGE_KEY,
        JSON.stringify(nextRecent.map(partnerEmojiToken)),
      )
    } catch {
      // The picker remains usable when browser storage is unavailable.
    }
  }

  return sortPartnerEmojisByRecentUse(nextRecent)
}
