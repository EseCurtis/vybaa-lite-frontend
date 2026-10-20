import type { ReactElement } from 'react'

import { Avatar } from '@/components/user/avatar.component'
import type { FlexxAuthor } from '@/shared/flexx/flexx-design'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

export function FlexxAuthorIdentity({
  author,
}: {
  author: FlexxAuthor
}): ReactElement {
  const partners = author.partnerIds.map(getRewindPersona)
  const label = `Flexx by ${partners.map((partner) => partner.name).join(' & ')}, Vybaa AI ${partners.length === 1 ? 'partner' : 'partners'}`
  return (
    <div
      role="img"
      aria-label={label}
      className="flex w-12 flex-col items-center gap-1.5"
      title={label}
    >
      <div aria-hidden="true" className="relative size-12">
        {partners.map((partner, index) => (
          <div
            key={partner.id}
            className="absolute"
            style={{ left: index * 8, top: index * 8, zIndex: index }}
          >
            <Avatar
              user={{
                id: partner.id,
                firstName: partner.name,
                avatarUrl: partner.avatar,
              }}
              size={partners.length === 1 ? 44 : 32}
            />
          </div>
        ))}
      </div>
      <span className="w-full break-words !text-center font-bbh text-[10px] font-semibold leading-tight">
        {partners.map((partner) => partner.name).join(' & ')}
      </span>
    </div>
  )
}
