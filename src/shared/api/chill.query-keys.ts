export const chillQueryKeys = {
  all: ['chill'] as const,
  sessions: () => [...chillQueryKeys.all, 'sessions'] as const,
  sessionsList: (limit?: number) => [...chillQueryKeys.sessions(), { limit }] as const,
  paginatedSessions: (page: number, limit: number) => [...chillQueryKeys.sessions(), 'paginated', { page, limit }] as const,
  summary: () => [...chillQueryKeys.all, 'summary'] as const,
  stats: () => [...chillQueryKeys.all, 'stats'] as const,
}
