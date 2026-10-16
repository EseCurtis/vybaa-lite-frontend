import { useEffect, useState } from 'react'

import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { getRewindScheduleCopy } from '@/shared/rewind/rewind-schedule-copy.util'

export function useRewindSchedule(
  overview: RewindRoutineOverview | undefined,
  personaId: RewindPersonaId,
  seed: string,
  onBoundary: () => Promise<unknown>,
) {
  const [now, setNow] = useState(Date.now)
  const schedule = getRewindScheduleCopy({ overview, personaId, seed, now })
  const hasCountdown = Boolean(schedule.countdown)

  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      hasCountdown ? 1000 : 30_000,
    )
    return () => window.clearInterval(interval)
  }, [hasCountdown])

  useEffect(() => {
    const timestamps = [
      overview?.currentSession?.windowEndsAt,
      overview?.nextSession?.scheduledFor,
    ]
      .flatMap((value) => (value ? [Date.parse(value)] : []))
      .filter((value) => value > Date.now())
    if (!timestamps.length) return
    const delay = Math.min(...timestamps) - Date.now() + 200
    const timer = window.setTimeout(() => {
      setNow(Date.now())
      void onBoundary()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [
    overview?.currentSession?.windowEndsAt,
    overview?.nextSession?.scheduledFor,
    onBoundary,
  ])

  useEffect(() => {
    function refreshClock(): void {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', refreshClock)
    return () => document.removeEventListener('visibilitychange', refreshClock)
  }, [])

  return schedule
}
