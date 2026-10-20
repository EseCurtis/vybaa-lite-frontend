import { useState } from 'react'
import type { CSSProperties, ReactElement } from 'react'

import { achievementBadgeAsset } from '@/shared/achievement-badges'
import { cn } from '@/shared/utils/helpers.util'

export function AchievementBadge({
  badge,
  className,
  style,
}: {
  badge?: { type?: string; milestone?: number; title?: string }
  className?: string
  style?: CSSProperties
}): ReactElement {
  const src = achievementBadgeAsset(badge?.type, badge?.milestone)
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <img
      src={failed === src ? achievementBadgeAsset() : src}
      alt={badge?.title ?? 'Vybaa achievement'}
      width={396}
      height={396}
      decoding="async"
      draggable={false}
      onError={failed === src ? undefined : () => setFailed(src)}
      className={cn(
        'inline-block aspect-square shrink-0 object-contain',
        className,
      )}
      style={style}
    />
  )
}
