export const chillQueryKeys = {
  all: ['chill'] as const,
  sessions: () => [...chillQueryKeys.all, 'sessions'] as const,
  sessionsList: (limit?: number) => [...chillQueryKeys.sessions(), { limit }] as const,
  stats: () => [...chillQueryKeys.all, 'stats'] as const,
}
