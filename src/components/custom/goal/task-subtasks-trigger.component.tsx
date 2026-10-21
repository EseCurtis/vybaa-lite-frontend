import { RiArrowRightSLine, RiListCheck3 } from '@remixicon/react'
import { useRef } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useGoalSubtasks } from '@/hooks/use-goal-subtasks.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Goal } from '@/shared/api/goal.api'
import type { SubtaskDraftStore } from '@/shared/goal/subtask-draft'
import { TaskSubtasks } from './task-subtasks.component'

export function TaskSubtasksTrigger({
  goal,
  draft,
}: {
  goal: Goal
  draft: SubtaskDraftStore
}): ReactElement {
  const { query } = useGoalSubtasks(goal.id)
  const sheet = useBottomSheetController()
  const trigger = useRef<HTMLButtonElement>(null)
  const completed = query.data?.filter((item) => item.completedAt).length ?? 0
  return (
    <Pressable
      type="button"
      ref={trigger}
      accessibilityLabel="Open subtasks"
      className="min-h-14 w-full items-center gap-3 py-3 text-left active:scale-[0.99] motion-reduce:transform-none"
      onPress={() =>
        sheet.present(
          <TaskSubtasks
            goal={goal}
            draft={draft}
            returnFocus={trigger.current}
          />,
          { title: 'Subtasks' },
        )
      }
    >
      <RiListCheck3
        size={21}
        className="text-card-lighter-3"
        aria-hidden="true"
      />
      <span className="flex-1 text-sm font-semibold">Subtasks</span>
      {query.data ? (
        <span
          aria-live="polite"
          className="text-xs tabular-nums text-card-lighter-3"
        >
          {completed}/{query.data.length}
        </span>
      ) : null}
      <RiArrowRightSLine
        size={19}
        className="text-card-lighter-3"
        aria-hidden="true"
      />
    </Pressable>
  )
}
