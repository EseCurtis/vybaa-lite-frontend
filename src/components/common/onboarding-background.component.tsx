import type { CSSProperties } from 'react'

interface OnboardingBackgroundProps {
  backgroundSize?: CSSProperties['backgroundSize']
}

export function OnboardingBackground({
  backgroundSize = 'cover',
}: OnboardingBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none transit absolute inset-0 z-0 bg-black"
      style={{
        background: 'url(/assets/onboarding-bg.png)',
        backgroundSize,
      }}
    />
  )
}
