/**
 * Query keys for goal-related queries
 * Centralized to ensure consistency across the app
 */
export const goalQueryKeys = {
  all: ['goals'] as const,
  lists: () => [...goalQueryKeys.all, 'list'] as const,
  list: (page?: number, limit?: number) => 
    page && limit 
      ? [...goalQueryKeys.lists(), { page, limit }] as const
      : [...goalQueryKeys.lists()] as const,
  infinite: (limit?: number) =>
    limit
      ? [...goalQueryKeys.lists(), 'infinite_', { limit }] as const
      : [...goalQueryKeys.lists(), 'infinite'] as const,
  details: () => [...goalQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalQueryKeys.details(), id] as const,
  current: () => [...goalQueryKeys.all, 'current'] as const,
}
