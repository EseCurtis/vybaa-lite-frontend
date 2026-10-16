import type {
  RewindOccurrence,
  RewindRoutineOverview,
} from '@/shared/api/rewind.api'
import { formatRewindCountdown } from './rewind-schedule-copy.util'

export type RewindCountdownState =
  | { status: 'idle'; boundary: null }
  | { status: 'ready'; boundary: number; resume: boolean }
  | {
      status: 'waiting'
      boundary: number
      label: string
    }

function isOpen(occurrence: RewindOccurrence | null, now: number): boolean {
  if (!occurrence || !['SCHEDULED', 'IN_PROGRESS'].includes(occurrence.status))
    return false
  const start = Date.parse(occurrence.scheduledFor ?? '')
  const end = Date.parse(occurrence.windowEndsAt ?? '')
  return start <= now && end > now
}

export function getRewindCountdownState(
  overview: RewindRoutineOverview | undefined,
  now: number,
): RewindCountdownState {
  if (!overview?.routine?.enabled) return { status: 'idle', boundary: null }
  const open = [overview.currentSession, overview.nextSession].find((session) =>
    isOpen(session, now),
  )
  if (open)
    return {
      status: 'ready',
      boundary: Date.parse(open.windowEndsAt ?? ''),
      resume: open.status === 'IN_PROGRESS',
    }
  const next = overview.nextSession
  const target = Date.parse(next?.scheduledFor ?? '')
  if (
    !next ||
    next.status !== 'SCHEDULED' ||
    !Number.isFinite(target) ||
    target <= now
  ) {
    return { status: 'idle', boundary: null }
  }
  const remaining = target - now
  return {
    status: 'waiting',
    boundary: target,
    label: formatRewindCountdown(remaining),
  }
}
