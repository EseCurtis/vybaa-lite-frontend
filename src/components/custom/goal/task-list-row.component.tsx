import { RiArrowRightSLine, RiCheckLine, RiRepeatLine } from '@remixicon/react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useRecordGoalProgress } from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { goalNeedsAttention } from '@/shared/goal/goal-due.util'
import { contrastingTextColor, seededColor } from '@/shared/utils/helpers.util'

function dueLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00`)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function TaskListRow({
  goal,
  onOpen,
}: {
  goal: Goal
  onOpen: (goal: Goal) => void
}): ReactElement {
  const record = useRecordGoalProgress()
  const color = seededColor(goal.title)
  const complete = goal.status === 'COMPLETED'
  const needsAttention = goalNeedsAttention(goal)
  const canComplete =
    goal.status === 'ACTIVE' &&
    goal.isDue &&
    Boolean(goal.nextOccurrence) &&
    goal.target.type === 'CHECK_IN_COUNT' &&
    !goal.isOverdue
  const progress = Math.min(100, Math.max(0, goal.progress.percentage))
  let progressText = `${Math.round(progress)}%`
  if (goal.target.type === 'CHECK_IN_COUNT')
    progressText = `${goal.progress.completedOccurrences}/${goal.target.count}`
  if (goal.target.type === 'QUANTITY')
    progressText = `${goal.progress.value.toLocaleString()}/${goal.target.amount.toLocaleString()} ${goal.target.unit ?? ''}`
  return (
    <div className="flex min-h-20 items-center gap-1 py-2">
      <Pressable
        accessibilityLabel={
          canComplete
            ? `Complete ${goal.title}${goal.schedule.type !== 'ONE_TIME' ? ' for today' : ''}`
            : `Open ${goal.title}`
        }
        aria-pressed={complete}
        className="size-11 shrink-0 items-center justify-center"
        disabled={record.isPending}
        onPress={() => {
          if (canComplete && goal.nextOccurrence)
            record.mutate({
              goalId: goal.id,
              occurrenceId: goal.nextOccurrence.id,
            })
          else onOpen(goal)
        }}
      >
        <span
          className="flex size-7 items-center justify-center rounded-full"
          style={{ backgroundColor: color, color: contrastingTextColor(color) }}
        >
          {complete ? (
            <RiCheckLine size={19} />
          ) : (
            <span className="size-4 rounded-full bg-cardd" />
          )}
        </span>
      </Pressable>
      <Pressable
        accessibilityLabel={`Open task ${goal.title}${needsAttention ? ', needs attention' : ''}`}
        className="min-h-16 min-w-0 flex-1 flex-col items-start justify-center gap-1 px-2 text-left"
        onPress={() => onOpen(goal)}
      >
        <span
          className={`w-full break-words text-base font-semibold ${complete ? 'text-card-lighter-3 line-through' : 'text-white'}`}
        >
          {goal.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-card-lighter-2">
          {goal.schedule.type !== 'ONE_TIME' ? (
            <RiRepeatLine aria-hidden="true" size={13} />
          ) : null}
          <span>
            {goal.nextOccurrence
              ? dueLabel(goal.nextOccurrence.dueDate)
              : goal.status.toLowerCase().replace('_', ' ')}
          </span>
          {needsAttention ? (
            <span className="text-danger-400">
              {goal.isOverdue ? 'Overdue' : 'Due'}
            </span>
          ) : null}
          <span className="tabular-nums">{progressText}</span>
        </span>
      </Pressable>
      <RiArrowRightSLine
        className="shrink-0 text-card-lighter-3"
        size={18}
        aria-hidden="true"
      />
    </div>
  )
}
