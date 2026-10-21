import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useAbandonGoal,
  useArchiveGoal,
  usePauseGoal,
  usePermanentlyDeleteGoal,
  useReopenGoal,
  useRescheduleGoalOccurrence,
  useResumeGoal,
} from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { RiCalendarLine, RiPauseLine, RiPlayLine } from '@remixicon/react'
import { useState } from 'react'
import { TaskDetailsContent } from './task-details-content.component'

interface GoalDetailsSheetProps {
  goal: Goal
  onDismiss?: () => void
}

export function GoalActionsSheet({
  goal,
  onAbandon,
  onArchive,
  onDelete,
  onDone,
  onRestart,
}: {
  goal: Goal
  onAbandon: () => void
  onArchive: () => void
  onDelete: () => void
  onDone: () => void
  onRestart: (goalId: string) => void
}) {
  const rescheduleOccurrence = useRescheduleGoalOccurrence()
  const pauseGoal = usePauseGoal()
  const resumeGoal = useResumeGoal()
  const abandonGoal = useAbandonGoal()
  const archiveGoal = useArchiveGoal()
  const permanentlyDeleteGoal = usePermanentlyDeleteGoal()
  const reopenGoal = useReopenGoal()
  const [rescheduleDate, setRescheduleDate] = useState('')
  const upcomingOccurrence = goal.nextOccurrence
  const today = new Date().toLocaleDateString('en-CA')

  async function handleAbandon(): Promise<void> {
    if (
      !confirm('End this task as abandoned? Your history will be preserved.')
    ) {
      return
    }
    await abandonGoal.mutateAsync(goal.id)
    onDone()
    onAbandon()
  }

  async function handleRestart(): Promise<void> {
    const response = await reopenGoal.mutateAsync(goal.id)
    onDone()
    onRestart(response.data.id)
  }

  async function handleArchive(): Promise<void> {
    await archiveGoal.mutateAsync(goal.id)
    onDone()
    onArchive()
  }

  async function handleDelete(): Promise<void> {
    if (
      !confirm(
        'Permanently delete this task content? Reward ledger records will be retained.',
      )
    ) {
      return
    }
    await permanentlyDeleteGoal.mutateAsync(goal.id)
    onDone()
    onDelete()
  }

  return (
    <View className="space-y-5 pb-3">
      {goal.status === 'ACTIVE' && upcomingOccurrence ? (
        <View className="space-y-3">
          <View className="flex-row items-center gap-2">
            <RiCalendarLine className="text-card-lighter-2" size={18} />
            <Text className="font-bold">Reschedule</Text>
          </View>
          <Text className="text-xs leading-4 text-card-lighter-2">
            Move the next occurrence once. Your recurring schedule stays the
            same.
          </Text>
          <Input
            min={today}
            type="date"
            value={rescheduleDate}
            onChange={(event) => setRescheduleDate(event.target.value)}
            className="bg-cardd"
          />
          <Button
            disabled={!rescheduleDate || rescheduleOccurrence.isPending}
            label={
              rescheduleOccurrence.isPending ? 'Moving…' : 'Move occurrence'
            }
            onClick={async () => {
              await rescheduleOccurrence.mutateAsync({
                dueDate: rescheduleDate,
                goalId: goal.id,
                occurrenceId: upcomingOccurrence.id,
              })
              onDone()
            }}
            size="sm"
            fullWidth
          />
        </View>
      ) : null}

      {goal.status === 'ACTIVE' ? (
        <View className="space-y-3 pt-5">
          <View className="flex-row items-center gap-2">
            <RiPauseLine className="text-card-lighter-2" size={18} />
            <Text className="font-bold">Pause task</Text>
          </View>
          <Text className="text-xs leading-4 text-card-lighter-2">
            Pause reminders and occurrences. Nothing is counted as missed while
            paused.
          </Text>
          <Button
            disabled={pauseGoal.isPending}
            label={pauseGoal.isPending ? 'Pausing…' : 'Pause task'}
            onClick={async () => {
              await pauseGoal.mutateAsync(goal.id)
              onDone()
            }}
            size="sm"
            variant="secondary"
            fullWidth
          />
        </View>
      ) : null}

      {goal.status === 'PAUSED' ? (
        <View className="space-y-3">
          <View className="flex-row items-center gap-2">
            <RiPlayLine className="text-card-lighter-2" size={18} />
            <Text className="font-bold">Resume task</Text>
          </View>
          <Text className="text-xs leading-4 text-card-lighter-2">
            Choose whether the original deadline stays fixed or moves by the
            paused time.
          </Text>
          <View className="flex-row gap-2">
            <Button
              className="flex-1 py-3"
              disabled={resumeGoal.isPending}
              label="Keep deadline"
              onClick={async () => {
                await resumeGoal.mutateAsync({
                  deadlinePolicy: 'KEEP_DEADLINE',
                  goalId: goal.id,
                })
                onDone()
              }}
              size="sm"
            />
            <Button
              className="flex-1 py-3"
              disabled={resumeGoal.isPending}
              label="Shift deadline"
              onClick={async () => {
                await resumeGoal.mutateAsync({
                  deadlinePolicy: 'SHIFT_DEADLINE',
                  goalId: goal.id,
                })
                onDone()
              }}
              size="sm"
              variant="secondary"
              fullWidth
            />
          </View>
        </View>
      ) : null}

      {['ACTIVE', 'PAUSED'].includes(goal.status) ? (
        <View className="space-y-3 pt-5">
          <Text className="font-bold text-danger-400">End task</Text>
          <Text className="text-xs leading-4 text-card-lighter-2">
            Abandoning preserves your timeline and records the task as
            unfinished.
          </Text>
          <Button
            disabled={abandonGoal.isPending}
            label={abandonGoal.isPending ? 'Ending…' : 'Abandon task'}
            onClick={() => void handleAbandon()}
            size="sm"
            variant="destructive"
            fullWidth
            textClassName="!text-white"
          />
        </View>
      ) : null}

      {['ABANDONED', 'AUTO_ABANDONED', 'COMPLETED'].includes(goal.status) ? (
        <View className="space-y-4">
          <View className="space-y-2">
            <View className="flex-row items-center gap-2">
              <RiPlayLine className="text-success-300" size={18} />
              <Text className="font-bold">Start again</Text>
            </View>
            <Text className="text-xs leading-4 text-card-lighter-2">
              Create a separate new run with the same task setup. This history
              stays unchanged.
            </Text>
            <Button
              disabled={reopenGoal.isPending}
              label={reopenGoal.isPending ? 'Starting…' : 'Start as a new task'}
              onClick={() => void handleRestart()}
              size="sm"
              fullWidth
            />
          </View>

          {!goal.archivedAt ? (
            <View className="space-y-2 pt-4">
              <Text className="font-bold">Archive task</Text>
              <Text className="text-xs leading-4 text-card-lighter-2">
                Move this task out of your main history. You can still find it
                under Archived.
              </Text>
              <Button
                disabled={archiveGoal.isPending}
                label={archiveGoal.isPending ? 'Archiving…' : 'Archive task'}
                onClick={() => void handleArchive()}
                size="sm"
                variant="secondary"
                fullWidth
              />
            </View>
          ) : (
            <View className="space-y-2 pt-4">
              <Text className="font-bold text-danger-400">
                Permanently delete
              </Text>
              <Text className="text-xs leading-4 text-card-lighter-2">
                Delete this task’s content. Historical reward transactions are
                retained.
              </Text>
              <Button
                disabled={permanentlyDeleteGoal.isPending}
                label={
                  permanentlyDeleteGoal.isPending
                    ? 'Deleting…'
                    : 'Permanently delete'
                }
                onClick={() => void handleDelete()}
                size="sm"
                variant="destructive"
                fullWidth
                textClassName="!text-white"
              />
            </View>
          )}
        </View>
      ) : null}
    </View>
  )
}

export function GoalDetailsSheet(props: GoalDetailsSheetProps) {
  return <TaskDetailsContent {...props} />
}
