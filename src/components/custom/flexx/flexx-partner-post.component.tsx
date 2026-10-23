import type { ReactElement } from 'react'

import { VybaaMark } from '@/components/common/vybaa-mark.component'
import { Avatar } from '@/components/user/avatar.component'
import type { FlexxDesign } from '@/shared/flexx/flexx-design'
import {
  FLEXX_THEMES,
  flexxEditorialForCard,
} from '@/shared/flexx/flexx-design'
import type { FlexxStory } from '@/shared/flexx/flexx-story'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { FlexxStoryArt } from './flexx-story-art.component'

export function FlexxPartnerPost({
  design,
  story,
  animate,
}: {
  design: FlexxDesign
  story: FlexxStory
  animate: boolean
}): ReactElement {
  const theme = FLEXX_THEMES[design.palette]
  const partners = design.author.partnerIds.map(getRewindPersona)
  const editorial = flexxEditorialForCard(design)
  return (
    <div
      data-flexx-layout={design.layout}
      data-flexx-post-kind="partner-note"
      data-flexx-palette={design.palette}
      data-flexx-animate={animate}
      className="flex size-full min-w-0 flex-col gap-[5cqw] overflow-y-auto p-[7cqw]"
      style={{
        containerType: 'inline-size',
        backgroundColor: theme.background,
        color: theme.foreground,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2">
          {partners.map((partner) => (
            <Avatar
              key={partner.id}
              user={{
                id: partner.id,
                firstName: partner.name,
                avatarUrl: partner.avatar,
              }}
              size={28}
            />
          ))}
        </div>
        <span className="min-w-0 font-bbh text-[clamp(11px,3.6cqw,15px)] font-bold">
          {partners.map((partner) => partner.name).join(' + ')}
          <span
            className="block font-normal"
            style={{ color: theme.secondary }}
          >
            Your AI {partners.length === 1 ? 'partner' : 'partners'}
          </span>
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-[5cqw]">
        <FlexxStoryArt design={design} className="w-[30cqw] self-end" />
        <h2 className="break-words font-display text-[clamp(20px,10cqw,36px)] font-extrabold leading-tight">
          {story.title}
        </h2>
        <p className="break-words font-bbh text-[clamp(16px,6cqw,24px)] font-medium leading-snug">
          {story.text}
        </p>
        <p
          data-flexx-editorial
          className="font-bbh text-[clamp(12px,4cqw,16px)] leading-snug"
          style={{ color: theme.secondary }}
        >
          {editorial.text}
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <span
          className="font-bbh text-[clamp(10px,3cqw,12px)]"
          style={{ color: theme.secondary }}
        >
          {story.source}
        </span>
        <VybaaMark
          tone={theme.foreground === '#ffffff' ? 'white' : 'dark'}
          className="size-7 shrink-0"
        />
      </div>
    </div>
  )
}
