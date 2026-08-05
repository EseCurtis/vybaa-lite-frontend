import type {
  RewindInsightsRange,
  RewindSessionsFilters,
} from '@/shared/api/rewind.api'

export const rewindQueryKeys = {
  all: ['rewind'] as const,
  routine: () => [...rewindQueryKeys.all, 'routine'] as const,
  sessions: () => [...rewindQueryKeys.all, 'sessions'] as const,
  session: (sessionId: string) =>
    [...rewindQueryKeys.sessions(), 'detail', sessionId] as const,
  insights: (range: RewindInsightsRange) =>
    [...rewindQueryKeys.all, 'insights', range] as const,
  paginatedSessions: (
    page: number,
    limit: number,
    filters?: RewindSessionsFilters,
  ) =>
    [
      ...rewindQueryKeys.sessions(),
      'paginated',
      { filters, limit, page },
    ] as const,
}
