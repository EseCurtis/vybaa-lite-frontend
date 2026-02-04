/**
 * Query keys for goal-related queries
 * Centralized to ensure consistency across the app
 */
export const goalQueryKeys = {
  all: ['goals'] as const,
  lists: () => [...goalQueryKeys.all, 'list'] as const,
  list: () => [...goalQueryKeys.lists()] as const,
  details: () => [...goalQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalQueryKeys.details(), id] as const,
  current: () => [...goalQueryKeys.all, 'current'] as const,
}
