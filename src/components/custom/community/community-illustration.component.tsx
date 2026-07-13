import type { CSSProperties, ReactElement } from 'react'

import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  getCommunityIllustration,
  isCommunityIllustrationToken,
} from '@/shared/community/community-illustrations'
import { cn } from '@/shared/utils/helpers.util'

interface CommunityIllustrationProps {
  className?: string
  label: string
  seed: string
  showInitials?: boolean
  value?: string | null
}

function getPatternStyle(
  variant: string,
  colors: { accent: string; background: string; soft: string },
): CSSProperties {
  const base: CSSProperties = {
    backgroundColor: colors.background,
  }

  if (variant === 'pulse') {
    return {
      ...base,
      backgroundImage: `radial-gradient(circle at 32% 28%, ${colors.accent} 0 15%, transparent 16%),
        radial-gradient(circle at 76% 72%, ${colors.soft} 0 12%, transparent 13%),
        repeating-radial-gradient(circle at 48% 52%, rgba(255,255,255,0.18) 0 2px, transparent 2px 13px)`,
    }
  }

  if (variant === 'bloom') {
    return {
      ...base,
      backgroundImage: `radial-gradient(ellipse at 26% 74%, ${colors.soft} 0 17%, transparent 18%),
        radial-gradient(ellipse at 72% 24%, ${colors.accent} 0 19%, transparent 20%),
        linear-gradient(135deg, rgba(255,255,255,0.18) 0 12%, transparent 12% 100%)`,
    }
  }

  if (variant === 'arc') {
    return {
      ...base,
      backgroundImage: `radial-gradient(circle at 100% 0, transparent 0 24%, ${colors.accent} 25% 31%, transparent 32%),
        radial-gradient(circle at 0 100%, transparent 0 22%, ${colors.soft} 23% 30%, transparent 31%),
        linear-gradient(45deg, rgba(255,255,255,0.14) 0 16%, transparent 16% 100%)`,
    }
  }

  if (variant === 'grid') {
    return {
      ...base,
      backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px),
        linear-gradient(0deg, rgba(255,255,255,0.16) 1px, transparent 1px),
        linear-gradient(135deg, ${colors.accent} 0 22%, transparent 22% 100%),
        radial-gradient(circle at 78% 76%, ${colors.soft} 0 12%, transparent 13%)`,
      backgroundSize: '18px 18px, 18px 18px, 100% 100%, 100% 100%',
    }
  }

  if (variant === 'current') {
    return {
      ...base,
      backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.16) 0 6px, transparent 6px 15px),
        radial-gradient(circle at 28% 32%, ${colors.accent} 0 16%, transparent 17%),
        radial-gradient(circle at 72% 68%, ${colors.soft} 0 18%, transparent 19%)`,
    }
  }

  return {
    ...base,
    backgroundImage: `radial-gradient(circle at 34% 34%, ${colors.accent} 0 18%, transparent 19%),
      radial-gradient(circle at 74% 68%, ${colors.soft} 0 14%, transparent 15%),
      repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0 4px, transparent 4px 12px)`,
  }
}

function getInitials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean)
  if (!words.length) {
    return 'V'
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

export function CommunityIllustration({
  className,
  label,
  seed,
  showInitials = false,
  value,
}: CommunityIllustrationProps): ReactElement {
  const illustration = getCommunityIllustration(value, seed)

  if (value && !isCommunityIllustrationToken(value)) {
    return (
      <View
        aria-label={`${label} community cover`}
        className={cn('relative overflow-hidden', className)}
        role="img"
      >
        <img
          alt={label}
          className="h-full w-full object-cover"
          src={value}
        />
      </View>
    )
  }

  return (
    <View
      aria-label={`${label} community illustration`}
      className={cn('relative overflow-hidden', className)}
      role="img"
      style={getPatternStyle(illustration.id, illustration)}
    >
      <View className="absolute inset-0 bg-black/10" />
      {showInitials ? (
        <View className="absolute inset-0  items-center justify-center">
          <Text className="font-bbh text-sm font-bold text-white">
            {getInitials(label)}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
