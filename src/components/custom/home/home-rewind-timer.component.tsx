import type { ReactElement } from 'react'

import { RewindCountdownTimer } from '@/components/custom/rewind/rewind-countdown-timer.component'

export function HomeRewindTimer(): ReactElement {
  return (
    <RewindCountdownTimer className="mt-1 font-bbh text-xs font-bold tabular-nums text-card-lighter-3" />
  )
}
