import { useState } from 'react'
import type { ReactElement } from 'react'

import { partnerEmojiAsset } from '@/shared/rewind/partner-emojis'
import type { PartnerEmoji as PartnerEmojiValue } from '@/shared/rewind/partner-emojis'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { cn } from '@/shared/utils/helpers.util'

export function PartnerEmoji({
  partnerId,
  emotion,
  className,
  decorative = false,
}: PartnerEmojiValue & {
  className?: string
  decorative?: boolean
}): ReactElement {
  const src = partnerEmojiAsset({ partnerId, emotion })
  const [failed, setFailed] = useState<string | null>(null)
  const partner = getRewindPersona(partnerId)
  return (
    <img
      src={failed === src ? partner.avatar : src}
      alt={decorative ? '' : `${partner.name}, ${emotion}`}
      aria-hidden={decorative || undefined}
      width={443}
      height={443}
      decoding="async"
      draggable={false}
      onError={failed === src ? undefined : () => setFailed(src)}
      className={cn(
        'inline-block aspect-square shrink-0 object-contain align-middle',
        className,
      )}
    />
  )
}
