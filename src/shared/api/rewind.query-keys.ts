import type {
  RewindInsightsRange,
  RewindSessionsFilters,
} from '@/shared/api/rewind.api'

export const rewindQueryKeys = {
  all: ['rewind'] as const,
  chats: () => [...rewindQueryKeys.all, 'chats'] as const,
  chatMessages: (chatId: string) =>
    [...rewindQueryKeys.chats(), chatId, 'messages'] as const,
  homeGreeting: () => [...rewindQueryKeys.all, 'home-greeting'] as const,
  observations: () => [...rewindQueryKeys.all, 'observations'] as const,
  reflections: (userId: string | undefined) =>
    [...rewindQueryKeys.all, 'reflections', userId] as const,
  dailyReflection: (userId: string | undefined, dayKey: string) =>
    [...rewindQueryKeys.reflections(userId), 'day', dayKey] as const,
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
