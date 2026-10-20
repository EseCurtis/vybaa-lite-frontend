import type { ReactElement } from 'react'

import {
  PARTNER_EMOJI_PATTERN,
  messageEmojiEmotion,
  parsePartnerEmoji,
} from '@/shared/rewind/partner-emojis'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { PartnerEmoji } from './partner-emoji.component'

export function PartnerEmojiText({
  content,
  partnerId,
  compact = false,
}: {
  content: string
  partnerId?: RewindPersonaId
  compact?: boolean
}): ReactElement {
  const standalone = parsePartnerEmoji(content.trim())
  if (standalone && !compact)
    return <PartnerEmoji {...standalone} className="size-28" />
  return (
    <>
      {content.split(PARTNER_EMOJI_PATTERN).map((segment, index) => {
        const parsed = parsePartnerEmoji(segment)
        const emotion = partnerId ? messageEmojiEmotion(segment) : null
        const emoji =
          parsed ?? (partnerId && emotion ? { partnerId, emotion } : null)
        return emoji ? (
          <PartnerEmoji key={index} {...emoji} className="mx-0.5 size-8" />
        ) : (
          segment
        )
      })}
    </>
  )
}
