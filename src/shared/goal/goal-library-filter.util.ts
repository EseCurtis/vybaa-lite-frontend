import type { GoalListFilter } from '@/shared/api/goal.api'

export type GoalLibraryTab = 'Active' | 'Ended' | 'Paused'

export function parseGoalListFilter(
  value: unknown,
): GoalListFilter | undefined {
  if (
    value === 'ACTIVE' ||
    value === 'ARCHIVED' ||
    value === 'DUE' ||
    value === 'ENDED' ||
    value === 'OVERDUE' ||
    value === 'PAUSED'
  ) {
    return value
  }
  return undefined
}

export function getGoalLibraryTab(filter: GoalListFilter): GoalLibraryTab {
  if (filter === 'PAUSED') return 'Paused'
  if (filter === 'ENDED' || filter === 'ARCHIVED') return 'Ended'
  return 'Active'
}

export function isActiveGoalFilter(
  filter: GoalListFilter,
): filter is 'ACTIVE' | 'DUE' | 'OVERDUE' {
  return filter === 'ACTIVE' || filter === 'DUE' || filter === 'OVERDUE'
}

export function isEndedGoalFilter(
  filter: GoalListFilter,
): filter is 'ARCHIVED' | 'ENDED' {
  return filter === 'ARCHIVED' || filter === 'ENDED'
}
