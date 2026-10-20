import { useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { PARTNER_EMOTIONS } from '@/shared/rewind/partner-emojis'
import type { PartnerEmoji as PartnerEmojiValue } from '@/shared/rewind/partner-emojis'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { PartnerEmoji } from './partner-emoji.component'

export function PartnerEmojiPicker({
  initialPartnerId,
  onSelect,
}: {
  initialPartnerId: RewindPersonaId
  onSelect: (emoji: PartnerEmojiValue) => void
}): ReactElement {
  const [partnerId, setPartnerId] = useState(initialPartnerId)
  return (
    <div aria-label="Partner emojis" className="max-h-64 overflow-y-auto pb-2">
      <div className="no-scrollbar flex gap-1 overflow-x-auto pb-2">
        {REWIND_PERSONAS.map((partner) => (
          <Pressable
            key={partner.id}
            accessibilityLabel={`${partner.name} emojis`}
            aria-pressed={partnerId === partner.id}
            className={`min-h-11 shrink-0 items-center rounded-full px-3 text-xs ${partnerId === partner.id ? 'bg-white text-black' : 'bg-card-light text-card-lighter-2'}`}
            onPress={() => setPartnerId(partner.id)}
          >
            {partner.name}
          </Pressable>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1">
        {PARTNER_EMOTIONS.map((emotion) => (
          <Pressable
            key={emotion}
            accessibilityLabel={`Send ${partnerId} ${emotion} emoji`}
            className="min-h-16 items-center justify-center rounded-xl bg-card-light"
            onPress={() => onSelect({ partnerId, emotion })}
          >
            <PartnerEmoji
              partnerId={partnerId}
              emotion={emotion}
              className="size-16"
              decorative
            />
          </Pressable>
        ))}
      </div>
    </div>
  )
}
