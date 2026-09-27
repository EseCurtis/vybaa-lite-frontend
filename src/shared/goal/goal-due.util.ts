import type { Goal } from '@/shared/api/goal.api'

export function goalNeedsAttention(
  goal: Pick<Goal, 'isDue' | 'isOverdue' | 'status'>,
): boolean {
  return goal.status === 'ACTIVE' && (goal.isDue || goal.isOverdue)
}
