import { useEffect, useState } from 'react'

import { getRewindCountdownState } from '@/shared/rewind/rewind-countdown.util'
import { useRewindRoutine } from './use-rewind.hook'

export function useRewindCountdown() {
  const routine = useRewindRoutine()
  const [now, setNow] = useState(Date.now)
  const countdown = getRewindCountdownState(routine.data, now)
  const { refetch } = routine
  const { status } = countdown
  const currentEnd = routine.data?.currentSession?.windowEndsAt
  const nextStart = routine.data?.nextSession?.scheduledFor
  const nextEnd = routine.data?.nextSession?.windowEndsAt

  useEffect(() => {
    if (status !== 'waiting') return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [status])

  useEffect(() => {
    const boundaries = new Set(
      [currentEnd, nextStart, nextEnd]
        .map((value) => Date.parse(value ?? ''))
        .filter((value) => value > Date.now()),
    )
    const timeouts = [...boundaries].map((boundary) =>
      window.setTimeout(
        () => {
          setNow(Date.now())
          void refetch()
        },
        boundary - Date.now() + 50,
      ),
    )
    return () => timeouts.forEach((timeout) => window.clearTimeout(timeout))
  }, [currentEnd, nextEnd, nextStart, refetch])

  useEffect(() => {
    function refreshClock(): void {
      if (document.visibilityState !== 'visible') return
      setNow(Date.now())
      void refetch()
    }
    document.addEventListener('visibilitychange', refreshClock)
    return () => document.removeEventListener('visibilitychange', refreshClock)
  }, [refetch])

  return countdown
}
