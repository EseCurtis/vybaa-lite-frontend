import { PartnerEmoji } from '@/components/custom/rewind/partner-emoji.component'
import type { PartnerEmoji as PartnerExpression } from '@/shared/rewind/partner-emojis'

import './splash-partners.css'

const PARTNERS: (PartnerExpression & {
  left: number
  top: number
  size: number
})[] = [
  { partnerId: 'ella', emotion: 'love', left: -78, top: 8, size: 50 },
  { partnerId: 'tobi', emotion: 'laughing', left: 145, top: 18, size: 46 },
  { partnerId: 'lyra', emotion: 'thinking', left: -56, top: 68, size: 46 },
  { partnerId: 'jake', emotion: 'cheering', left: 126, top: 70, size: 48 },
  { partnerId: 'ariel', emotion: 'listening', left: -12, top: -44, size: 46 },
  { partnerId: 'neeja', emotion: 'surprised', left: 84, top: -44, size: 46 },
]

export function SplashPartners() {
  return (
    <div
      aria-hidden="true"
      data-testid="splash-partners"
      className="splash-partners pointer-events-none absolute inset-0 z-10"
    >
      {PARTNERS.map((partner, index) => (
        <div
          key={partner.partnerId}
          data-splash-partner={partner.partnerId}
          className="splash-partner absolute"
          style={{
            left: partner.left,
            top: partner.top,
            width: partner.size,
            height: partner.size,
            animationDelay: `${index * 0.3}s`,
          }}
        >
          <PartnerEmoji
            partnerId={partner.partnerId}
            emotion={partner.emotion}
            decorative
            className="size-full"
          />
        </div>
      ))}
    </div>
  )
}
