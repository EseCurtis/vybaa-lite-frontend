import type { RewindSessionsFilters } from '@/shared/api/rewind.api'

export const rewindQueryKeys = {
  all: ['rewind'] as const,
  sessions: () => [...rewindQueryKeys.all, 'sessions'] as const,
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
