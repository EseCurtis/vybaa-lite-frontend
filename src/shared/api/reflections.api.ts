import type { RewindSession } from './rewind.api'
import { http } from './http'

export type ReflectionSession = Pick<
  RewindSession,
  | 'completed'
  | 'createdAt'
  | 'id'
  | 'personaId'
  | 'scheduledFor'
  | 'sessionDateKey'
  | 'status'
  | 'summary'
> & {
  origin?: 'MANUAL' | 'SCHEDULED'
}

export interface DailyReflection {
  id: string
  localDateKey: string
  timezone: string
  state: 'COLLECTING' | 'EMPTY' | 'PRIVATE' | 'READY'
  processing?: boolean
  summary: string
  insights: string[]
  participantIds: string[]
  sourceCounts: Record<string, number>
  analyzedAt: string | null
  updatedAt: string
}

export interface ReflectionDay {
  dayKey: string
  reflection: DailyReflection
  sessions: ReflectionSession[]
}

export interface ReflectionDaysPage {
  today: string
  timezone: string
  days: ReflectionDay[]
  upcomingSessions: ReflectionSession[]
  nextCursor: string | null
}

export const reflectionsAPI = {
  async day(dayKey: string, signal: AbortSignal): Promise<DailyReflection> {
    if (!isReflectionDayKey(dayKey))
      throw new Error('Choose a valid reflection date')
    const response = await http.get<{ data: DailyReflection }>(
      `/api/v1/rewind/reflections/${encodeURIComponent(dayKey)}`,
      { signal },
    )
    return response.data.data
  },
  async days(
    cursor: string | null,
    signal: AbortSignal,
  ): Promise<ReflectionDaysPage> {
    const response = await http.get<{ data: ReflectionDaysPage }>(
      '/api/v1/rewind/reflections',
      { params: { limit: 7, ...(cursor ? { cursor } : {}) }, signal },
    )
    return response.data.data
  },
}

export function isReflectionDayKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T12:00:00Z`)
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}
