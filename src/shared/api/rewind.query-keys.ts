export const rewindQueryKeys = {
  all: ['rewind'] as const,
  sessions: () => [...rewindQueryKeys.all, 'sessions'] as const,
  paginatedSessions: (page: number, limit: number) =>
    [...rewindQueryKeys.sessions(), 'paginated', { page, limit }] as const,
}
