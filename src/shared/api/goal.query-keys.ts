/**
 * Query keys for goal-related queries
 * Centralized to ensure consistency across the app
 */
export const goalQueryKeys = {
  all: ['goals'] as const,
  lists: () => [...goalQueryKeys.all, 'list'] as const,
  list: (page: number = 1, limit: number = 10, canCheckIn?: boolean) =>
    [...goalQueryKeys.lists(), { page, limit, canCheckIn }] as const,
  infinite: (limit: number = 10, canCheckIn?: boolean, userId?: string) =>
    [...goalQueryKeys.lists(), 'infinite', { limit, canCheckIn, userId }] as const,
  details: () => [...goalQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalQueryKeys.details(), id] as const,
  current: () => [...goalQueryKeys.all, 'current'] as const,
}
