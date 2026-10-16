import type { ReactElement } from 'react'

import { useRewindCountdown } from '@/hooks/use-rewind-countdown.hook'

export function RewindCountdownTimer({
  className = 'font-display text-2xl font-bold tabular-nums tracking-wider text-white',
}: {
  className?: string
}): ReactElement | null {
  const countdown = useRewindCountdown()
  if (countdown.status !== 'waiting') return null
  return (
    <span
      role="timer"
      aria-live="off"
      aria-label={`Next Rewind in ${countdown.label}`}
      className={className}
    >
      {countdown.label}
    </span>
  )
}
