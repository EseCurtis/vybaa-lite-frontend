import type { ReactElement } from 'react'

import { useFlexxMotion } from '@/hooks/use-flexx-motion.hook'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { PartnerEmoji } from './partner-emoji.component'
import './partner-typing.css'

export function PartnerTyping({
  partnerId,
}: {
  partnerId: RewindPersonaId
}): ReactElement {
  const motion = useFlexxMotion()
  const partner = getRewindPersona(partnerId)
  return (
    <div
      role="status"
      aria-label={`${partner.name} is typing`}
      data-partner-typing
      data-animate={motion.enabled}
      className="flex min-h-20 items-center gap-2 py-1"
    >
      <div className="partner-typing-head size-20 origin-bottom">
        <PartnerEmoji
          partnerId={partnerId}
          emotion="typing"
          className="size-full"
          decorative
        />
      </div>
      <span aria-hidden="true" className="font-bbh text-xs text-card-lighter-2">
        {partner.name} is typing<span className="partner-typing-cursor">…</span>
      </span>
    </div>
  )
}
