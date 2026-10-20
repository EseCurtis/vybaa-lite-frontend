import type { GoalListFilter } from './goal.api'

export const goalQueryKeys = {
  all: ['goals-v2'] as const,
  detail: (id: string) => [...goalQueryKeys.details(), id] as const,
  details: () => [...goalQueryKeys.all, 'detail'] as const,
  legacy: () => [...goalQueryKeys.all, 'legacy'] as const,
  occurrences: (id: string) =>
    [...goalQueryKeys.detail(id), 'occurrences'] as const,
  list: (filter: GoalListFilter, limit = 20) =>
    limit === 20
      ? ([...goalQueryKeys.lists(), filter] as const)
      : ([...goalQueryKeys.lists(), filter, { limit }] as const),
  lists: () => [...goalQueryKeys.all, 'list'] as const,
}
