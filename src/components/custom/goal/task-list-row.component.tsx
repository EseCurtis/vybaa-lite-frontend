import { RiArrowRightSLine, RiCheckLine, RiRepeatLine } from '@remixicon/react'
import type { ReactElement } from 'react'
import { useRef, useState } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Goal } from '@/shared/api/goal.api'
import { goalNeedsAttention } from '@/shared/goal/goal-due.util'
import { taskStatus } from '@/shared/goal/task-presentation'
import { contrastingTextColor, seededColor } from '@/shared/utils/helpers.util'
import {
  createTaskProgressDraft,
  TaskProgressSheet,
} from './task-progress-sheet.component'

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
  const sheet = useBottomSheetController()
  const trigger = useRef<HTMLButtonElement>(null)
  const [draft] = useState(createTaskProgressDraft)
  const color = seededColor(goal.title)
  const complete = goal.status === 'COMPLETED'
  const needsAttention = goalNeedsAttention(goal)
  const status = taskStatus(goal)
  const canComplete =
    goal.status === 'ACTIVE' &&
    goal.isDue &&
    Boolean(goal.nextOccurrence) &&
    !goal.archivedAt
  const progress = Math.min(100, Math.max(0, goal.progress.percentage))
  let progressText = `${Math.round(progress)}%`
  if (goal.target.type === 'CHECK_IN_COUNT')
    progressText = `${goal.progress.completedOccurrences}/${goal.target.count}`
  if (goal.target.type === 'QUANTITY')
    progressText = `${goal.progress.value.toLocaleString()}/${goal.target.amount.toLocaleString()} ${goal.target.unit ?? ''}`
  return (
    <div className="flex min-h-20 items-center gap-1 py-2">
      <Pressable
        ref={trigger}
        type="button"
        accessibilityLabel={
          canComplete
            ? `Record progress for ${goal.title}`
            : `Open ${goal.title}`
        }
        aria-pressed={complete}
        className="size-11 shrink-0 items-center justify-center"
        onPress={() => {
          if (canComplete && goal.nextOccurrence)
            sheet.present(
              <TaskProgressSheet
                goal={goal}
                draft={draft}
                returnFocus={trigger.current}
              />,
              {
                title:
                  goal.target.type === 'QUANTITY' ? 'Add progress' : 'Check in',
              },
            )
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
        type="button"
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
          {goal.nextOccurrence && (!goal.isDue || goal.isOverdue) ? (
            <span>{dueLabel(goal.nextOccurrence.dueDate)}</span>
          ) : null}
          <span className={`font-semibold ${status.tone}`}>{status.label}</span>
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
