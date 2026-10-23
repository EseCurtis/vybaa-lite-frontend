import {
  RiArrowRightSLine,
  RiCalendarLine,
  RiTrophyLine,
} from '@remixicon/react'
import { useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Goal } from '@/shared/api/goal.api'
import { createSubtaskDraft } from '@/shared/goal/subtask-draft'
import {
  taskDateLabel,
  taskProgressLabel,
  taskRewardSummary,
  taskStatus,
} from '@/shared/goal/task-presentation'
import { seededColor } from '@/shared/utils/helpers.util'
import {
  createTaskProgressDraft,
  TaskProgressSheet,
} from './task-progress-sheet.component'
import { TaskRewards } from './task-rewards.component'
import { TaskSubtasksTrigger } from './task-subtasks-trigger.component'
import { TaskTimeline } from './task-timeline.component'

type DetailTab = 'overview' | 'rewards' | 'timeline'

export function TaskDetailsContent({
  goal,
  onDismiss,
}: {
  goal: Goal
  onDismiss?: () => void
}): ReactElement {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [subtaskDraft] = useState(createSubtaskDraft)
  const [progressDraft] = useState(createTaskProgressDraft)
  const sheet = useBottomSheetController()
  const progressTrigger = useRef<HTMLButtonElement>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const status = taskStatus(goal)
  const percentage = Math.max(0, Math.min(100, goal.progress.percentage))
  const color = seededColor(goal.title)

  function openProgress(): void {
    sheet.present(
      <TaskProgressSheet
        goal={goal}
        draft={progressDraft}
        returnFocus={progressTrigger.current}
        onSaved={(saved) => {
          if (saved.status === 'COMPLETED') setShowCelebration(true)
          else onDismiss?.()
        }}
      />,
      { title: goal.target.type === 'QUANTITY' ? 'Add progress' : 'Check in' },
    )
  }

  return (
    <div className="space-y-5 pb-6">
      <header className="space-y-2 pt-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className={`text-xs font-semibold ${status.tone}`}>
            {status.label}
          </span>
        </div>
        <h1 className="break-words text-2xl font-bold leading-tight tracking-tight">
          {goal.title}
        </h1>
      </header>
      <div className="sticky top-0 z-20 bg-cardd py-2">
        <div
          role="group"
          aria-label="Task details sections"
          className="flex gap-1 rounded-2xl bg-card-light-50 p-1"
        >
          {(
            [
              ['overview', 'Overview'],
              ['timeline', 'Timeline'],
              ['rewards', 'Rewards'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              type="button"
              key={value}
              aria-pressed={activeTab === value}
              onPress={() => setActiveTab(value)}
              className={`min-h-11 flex-1 items-center justify-center rounded-xl px-2 py-2 text-xs font-bold active:scale-[0.98] motion-reduce:transform-none ${activeTab === value ? 'bg-white text-black' : 'text-card-lighter-3'}`}
            >
              {label}
            </Pressable>
          ))}
        </div>
      </div>
      {activeTab === 'overview' ? (
        <section aria-label="Task overview" className="space-y-5">
          {showCelebration ? (
            <div
              role="status"
              className="flex items-center gap-2 text-sm font-semibold text-success-400"
            >
              <RiTrophyLine size={21} />
              Task completed. Your history is saved.
            </div>
          ) : null}
          {goal.description ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-card-lighter-3">
              {goal.description}
            </p>
          ) : null}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold">{taskProgressLabel(goal)}</p>
              <span className="text-sm tabular-nums text-card-lighter-3">
                {Math.round(percentage)}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Task progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percentage}
              className="h-1.5 overflow-hidden rounded-full bg-card-light"
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
          {goal.nextOccurrence ? (
            <p className={`flex items-center gap-2 text-sm ${status.tone}`}>
              <RiCalendarLine size={17} aria-hidden="true" />
              {taskDateLabel(goal.nextOccurrence.dueDate)}
            </p>
          ) : null}
          {goal.status === 'ACTIVE' && goal.isDue && goal.nextOccurrence ? (
            <Pressable
              ref={progressTrigger}
              type="button"
              onPress={openProgress}
              className="min-h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black active:scale-[0.98] motion-reduce:transform-none"
            >
              {goal.target.type === 'QUANTITY' ? 'Add progress' : 'Check in'}
            </Pressable>
          ) : goal.status === 'ACTIVE' && !goal.nextOccurrence ? (
            <p className="text-sm text-card-lighter-3">
              No remaining check-ins.
            </p>
          ) : null}
          {goal.status === 'ABANDONED' || goal.status === 'AUTO_ABANDONED' ? (
            <p role="status" className="text-sm text-card-lighter-3">
              {goal.status === 'AUTO_ABANDONED'
                ? 'Ended automatically.'
                : 'Ended unfinished.'}{' '}
              Your history is saved; restart or archive in task settings.
            </p>
          ) : null}
          <TaskSubtasksTrigger goal={goal} draft={subtaskDraft} />
          {goal.reward.eligible ||
          goal.reward.releasedPoints ||
          goal.reward.pendingPoints ? (
            <Pressable
              type="button"
              onPress={() => setActiveTab('rewards')}
              className="min-h-11 w-full items-center justify-between gap-3 text-left text-xs text-card-lighter-3"
              accessibilityLabel="View task rewards"
            >
              <span>{taskRewardSummary(goal.reward)}</span>
              <RiArrowRightSLine size={18} aria-hidden="true" />
            </Pressable>
          ) : null}
        </section>
      ) : null}
      <TaskTimeline goal={goal} active={activeTab === 'timeline'} />
      {activeTab === 'rewards' ? <TaskRewards goal={goal} /> : null}
    </div>
  )
}
