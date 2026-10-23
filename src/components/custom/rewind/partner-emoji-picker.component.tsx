import { useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import type { PartnerEmoji as PartnerEmojiValue } from '@/shared/rewind/partner-emojis'
import {
  recordRecentPartnerEmoji,
  sortPartnerEmojisByRecentUse,
} from '@/shared/rewind/recent-partner-emojis'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { PartnerEmoji } from './partner-emoji.component'

export function PartnerEmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: PartnerEmojiValue) => void
}): ReactElement {
  const [emojis, setEmojis] = useState(sortPartnerEmojisByRecentUse)
  return (
    <section
      aria-label="Partner stickers"
      className="max-h-[min(36dvh,300px)] overflow-y-auto overscroll-contain rounded-2xl bg-card-light-50 p-2"
    >
      <h2 className="px-2 py-2 font-bbh text-xs font-bold text-card-lighter-2">
        Stickers
      </h2>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(52px,1fr))] gap-1">
        {emojis.map((emoji) => {
          const partner = getRewindPersona(emoji.partnerId)
          return (
            <Pressable
              key={`${emoji.partnerId}-${emoji.emotion}`}
              accessibilityLabel={`Send ${partner.name} ${emoji.emotion} sticker`}
              className="min-h-14 min-w-11 items-center justify-center rounded-xl hover:bg-card-light focus-visible:bg-card-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              onPress={() => {
                setEmojis(recordRecentPartnerEmoji(emoji))
                onSelect(emoji)
              }}
            >
              <PartnerEmoji
                partnerId={emoji.partnerId}
                emotion={emoji.emotion}
                className="size-14"
                decorative
              />
            </Pressable>
          )
        })}
      </div>
    </section>
  )
}
