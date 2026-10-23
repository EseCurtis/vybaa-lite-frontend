import { Icon } from '@iconify/react'
import {
  RiEmotionHappyFill,
  RiEmotionLaughFill,
  RiEmotionNormalFill,
} from '@remixicon/react'
import type { ReactElement } from 'react'

import type { FlexxDesign } from '@/shared/flexx/flexx-design'
import { flexxStorySeed } from '@/shared/flexx/flexx-story'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { FlexxPartnerExpression } from './flexx-partner-expression.component'

export function FlexxStoryArt({
  design,
  className = 'w-[28cqw]',
}: {
  design: FlexxDesign
  className?: string
}): ReactElement | null {
  const seed = flexxStorySeed(design.id)
  const style = seed % 4
  const partnerId = design.author.partnerIds[0]
  if (style === 3) return null
  if (style === 0 && partnerId)
    return (
      <FlexxPartnerExpression
        partnerId={partnerId}
        expression={design.questionnaire ? 'thinking' : 'listening'}
        className={className}
      />
    )
  const emojis = design.questionnaire
    ? ['🌙', '🌊', '🌸']
    : ['✨', '🌟', '🌸', '☀️', '🌊']
  const emoji = emojis[Math.floor(seed / 4) % emojis.length] ?? '✨'
  const faces = [RiEmotionHappyFill, RiEmotionLaughFill, RiEmotionNormalFill]
  const Face = faces[Math.floor(seed / 4) % faces.length] ?? RiEmotionHappyFill
  return (
    <div
      aria-hidden="true"
      data-flexx-art={style === 1 ? 'twemoji' : 'flat'}
      className={`pointer-events-none aspect-square shrink-0 ${className}`}
    >
      <div
        data-flexx-loop={design.questionnaire ? undefined : 'symbol'}
        className="size-full"
      >
        {style === 1 ? (
          <Icon icon={getEmojiIcon(emoji)} className="size-full" />
        ) : (
          <Face className="size-full" />
        )}
      </div>
    </div>
  )
}
