import type { Goal } from '@/shared/api/goal.api'

export function taskStatus(
  goal: Pick<Goal, 'status' | 'isDue' | 'isOverdue' | 'nextOccurrence'>,
): { label: string; tone: string } {
  if (goal.status === 'COMPLETED')
    return { label: 'Completed', tone: 'text-success-400' }
  if (goal.status === 'PAUSED')
    return { label: 'Paused', tone: 'text-card-lighter-3' }
  if (goal.status === 'ABANDONED' || goal.status === 'AUTO_ABANDONED')
    return { label: 'Ended', tone: 'text-card-lighter-3' }
  if (goal.nextOccurrence?.status === 'GRACE')
    return { label: 'Grace window', tone: 'text-warning-400' }
  if (goal.isOverdue) return { label: 'Overdue', tone: 'text-danger-400' }
  if (goal.isDue) return { label: 'Due today', tone: 'text-warning-400' }
  return { label: 'Upcoming', tone: 'text-card-lighter-3' }
}

export function taskDateLabel(value: string, now = new Date()): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (date.toDateString() === now.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function taskProgressLabel(goal: Goal): string {
  if (goal.target.type === 'QUANTITY')
    return `${goal.progress.value.toLocaleString()} / ${goal.target.amount.toLocaleString()} ${goal.target.unit ?? ''}`.trim()
  if (goal.target.type === 'UNTIL_DATE')
    return `Keep going until ${taskDateLabel(goal.target.endDate ?? goal.hardStopDate)}`
  if (goal.target.count === 1 && goal.schedule.type === 'ONE_TIME')
    return goal.status === 'COMPLETED' ? 'Finished' : 'Finish once'
  return `${goal.progress.completedOccurrences} / ${goal.target.count} check-ins`
}

export function taskRewardSummary(reward: Goal['reward']): string {
  if (reward.releasedPoints || reward.pendingPoints) {
    const parts = [`${reward.releasedPoints.toFixed(2)} added`]
    if (reward.pendingPoints)
      parts.push(`${reward.pendingPoints.toFixed(2)} pending`)
    return `${parts.join(' · ')} Play Points`
  }
  return reward.eligible
    ? `Up to ${reward.totalPotential.toFixed(2)} Play Points`
    : 'No Play Points for this task'
}
