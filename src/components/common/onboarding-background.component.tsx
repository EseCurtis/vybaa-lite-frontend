import { cn } from '@/shared/utils/helpers.util'
import type { CSSProperties } from 'react'

interface OnboardingBackgroundProps {
  backgroundSize?: CSSProperties['backgroundSize']
  className?: string
}

export function OnboardingBackground({
  backgroundSize = 'cover',
  className,
}: OnboardingBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        className,
        'pointer-events-none transit absolute inset-0 z-0 bg-black',
      )}
      style={{
        background: 'url(/assets/onboarding-bg.png)',
        backgroundSize,
      }}
    />
  )
}
