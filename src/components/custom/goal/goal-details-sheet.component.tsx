import { Input } from '@/components/common/input.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useAbandonGoal,
  useArchiveGoal,
  usePauseGoal,
  usePermanentlyDeleteGoal,
  useRecordGoalProgress,
  useReopenGoal,
  useRescheduleGoalOccurrence,
  useResumeGoal,
  useSaveGoalReview,
} from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { createSubtaskDraft } from '@/shared/goal/subtask-draft'
import { cn, seededColor } from '@/shared/utils/helpers.util'
import {
  RiCalendarLine,
  RiCheckLine,
  RiErrorWarningLine,
  RiFireFill,
  RiPauseLine,
  RiPlayLine,
  RiTrophyLine,
} from '@remixicon/react'
import moment from 'moment'
import { useState } from 'react'
import { TaskTimeline } from './task-timeline.component'
import { TaskSubtasksTrigger } from './task-subtasks-trigger.component'
import {
  AttachmentPicker,
  type Attachment,
} from './attachment-picker.component'

interface GoalDetailsSheetProps {
  goal: Goal
  onDismiss?: () => void
}

type GoalDetailsTab = 'overview' | 'timeline' | 'rewards' | 'review'

function targetLabel(goal: Goal): string {
  if (goal.target.type === 'QUANTITY') {
    return `${goal.progress.value.toLocaleString()} / ${goal.target.amount.toLocaleString()} ${goal.target.unit ?? ''}`
  }
  if (goal.target.type === 'UNTIL_DATE') {
    return `Perfect adherence until ${goal.target.endDate ?? goal.hardStopDate}`
  }
  return `${goal.progress.completedOccurrences} / ${goal.target.count} check-ins`
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

export function GoalDetailsSheet({ goal, onDismiss }: GoalDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState<GoalDetailsTab>('overview')
  const [subtaskDraft] = useState(createSubtaskDraft)
  const recordProgress = useRecordGoalProgress()
  const saveReview = useSaveGoalReview()
  const [showProgress, setShowProgress] = useState(false)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [reviewAttachments, setReviewAttachments] = useState<Attachment[]>(
    (goal.conclusion?.attachments ?? []) as Attachment[],
  )
  const [showCelebration, setShowCelebration] = useState(false)
  const [rating, setRating] = useState(goal.conclusion?.rating ?? 0)
  const [reflection, setReflection] = useState(
    goal.conclusion?.reflection ?? '',
  )
  const [nextStep, setNextStep] = useState(goal.conclusion?.nextStep ?? '')
  const [reviewSaved, setReviewSaved] = useState(
    Boolean(
      goal.conclusion?.rating ||
      goal.conclusion?.reflection ||
      goal.conclusion?.nextStep ||
      goal.conclusion?.attachments?.length,
    ),
  )
  const ended = ['ABANDONED', 'AUTO_ABANDONED', 'COMPLETED'].includes(
    goal.status,
  )
  const color = seededColor(goal.title)

  async function submitProgress(): Promise<void> {
    if (!goal.nextOccurrence) return
    const response = await recordProgress.mutateAsync({
      amount: goal.target.type === 'QUANTITY' ? Number(amount) : undefined,
      attachments,
      goalId: goal.id,
      notes: notes.trim() || undefined,
      occurrenceId: goal.nextOccurrence.id,
    })
    if (response.data.status === 'COMPLETED') {
      setShowCelebration(true)
      setShowProgress(false)
      return
    }
    onDismiss?.()
  }

  async function saveConclusionReview(): Promise<void> {
    await saveReview.mutateAsync({
      goalId: goal.id,
      attachments: reviewAttachments,
      nextStep: nextStep.trim() || null,
      rating: rating || null,
      reflection: reflection.trim() || null,
    })
    setReviewSaved(true)
  }

  return (
    <View className="space-y-5 pb-6">
      {showCelebration ? (
        <View className="rounded-xl bg-green-950 p-6 text-center">
          <RiTrophyLine className="mx-auto text-green-300" size={40} />
          <Text className="mt-3   !text-center text-xl font-bold">
            You completed this task!
          </Text>
          <Text className="mt-1 !text-center text-sm text-green-400">
            Your conclusion and earned rewards are now saved.
          </Text>
        </View>
      ) : null}
      {goal.status === 'ABANDONED' || goal.status === 'AUTO_ABANDONED' ? (
        <View
          aria-live="polite"
          className="flex-row items-start gap-3 rounded-2xl bg-warning-900 p-4"
          role="status"
        >
          <View className="size-9 shrink-0 items-center justify-center rounded-full bg-warning-700">
            <RiErrorWarningLine className="text-warning-100" size={18} />
          </View>
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-bold text-warning-100">
              {goal.status === 'AUTO_ABANDONED'
                ? 'This task ended automatically'
                : 'This task was abandoned'}
            </Text>
            <Text className="text-xs leading-5 text-warning-200">
              Its history is saved. Open task settings to start a separate new
              run or archive this one.
            </Text>
          </View>
        </View>
      ) : null}
      <View className="rounded-xl p-6" style={{ backgroundColor: color }}>
        {goal.status === 'COMPLETED' ? (
          <View className="mb-3 flex-row items-center gap-2">
            <RiTrophyLine className="text-black" size={20} />
            <Text className="font-bold text-black">Task completed</Text>
          </View>
        ) : null}
        <Text className="text-lg font-bold text-black">{goal.title}</Text>
        {goal.description ? (
          <Text className="mt-1 text-sm text-black/60">{goal.description}</Text>
        ) : null}
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-sm text-black/70">{targetLabel(goal)}</Text>
          <Text className="font-bold text-black">
            {Math.round(goal.progress.percentage)}%
          </Text>
        </View>
        <View className="mt-2 h-2 overflow-hidden rounded-full bg-black/10">
          <View
            className="h-full rounded-full bg-black"
            style={{ width: `${goal.progress.percentage}%` }}
          />
        </View>
      </View>

      <View className="grid grid-cols-3 gap-2">
        <View className="rounded-2xl bg-card-light-50 p-3">
          <Text className="text-xs text-card-lighter-2">Streak</Text>
          <Text className="font-bold">{goal.progress.currentStreak}</Text>
        </View>
        <View className="rounded-2xl bg-card-light-50 p-3">
          <Text className="text-xs text-card-lighter-2">Adherence</Text>
          <Text className="font-bold">
            {Math.round(goal.progress.adherenceRate)}%
          </Text>
        </View>
        <View className="rounded-2xl bg-card-light-50 p-3">
          <Text className="text-xs text-card-lighter-2">Points</Text>
          <Text className="font-bold">
            {goal.reward.pendingPoints.toFixed(2)}
          </Text>
        </View>
      </View>

      {goal.status === 'ACTIVE' && goal.isDue && goal.nextOccurrence ? (
        <View className="space-y-3">
          {!showProgress ? (
            <Button
              fullWidth
              label={
                goal.target.type === 'QUANTITY' ? 'Add progress' : 'Check in'
              }
              leftIcon={<RiFireFill size={18} />}
              onClick={() => setShowProgress(true)}
            />
          ) : (
            <View className="space-y-3 rounded-2xl bg-card-light-50 p-4">
              {goal.target.type === 'QUANTITY' ? (
                <Input
                  min={0.01}
                  placeholder={`Amount in ${goal.target.unit ?? 'units'}`}
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="bg-cardd"
                />
              ) : null}
              <TextArea
                maxLength={2000}
                placeholder="How did it go? (optional)"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="bg-cardd"
              />
              <AttachmentPicker
                attachments={attachments}
                maxAttachments={5}
                onAttachmentsChange={setAttachments}
              />
              <Button
                fullWidth
                label="Save progress"
                loading={recordProgress.isPending}
                disabled={
                  recordProgress.isPending ||
                  (goal.target.type === 'QUANTITY' && Number(amount) <= 0)
                }
                onClick={submitProgress}
              />
            </View>
          )}
        </View>
      ) : goal.status === 'ACTIVE' ? (
        <View className="rounded-2xl bg-card-light-50 p-4">
          <Text className="text-center mx-auto text-sm text-card-lighter-2">
            {goal.nextOccurrence
              ? `Next occurence, ${moment(goal.nextOccurrence.dueDate).fromNow()}`
              : 'No remaining occurrence'}
          </Text>
        </View>
      ) : null}

      <View className="sticky top-0 z-20 -mx-1 bg-cardd py-2">
        <View className="flex-row gap-1 rounded-2xl bg-card-light-50 p-1">
          {(
            [
              ['overview', 'Overview'],
              ['timeline', 'Timeline'],
              ['rewards', 'Rewards'],
              ['review', 'Review'],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              aria-pressed={activeTab === value}
              className={cn(
                'min-h-11 flex-1 rounded-xl px-2 py-2.5 text-center flex justify-center',
                activeTab === value ? 'bg-white' : 'bg-transparent',
              )}
              key={value}
              onPress={() => setActiveTab(value)}
            >
              <Text
                className={cn(
                  'text-center text-xs font-bold',
                  activeTab === value ? 'text-black' : 'text-card-lighter-2',
                )}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === 'overview' ? (
        <TaskSubtasksTrigger goal={goal} draft={subtaskDraft} />
      ) : null}

      {activeTab === 'rewards' ? (
        <View className="space-y-2">
          <Text className="font-bold">Reward path</Text>
          {!goal.reward.eligible ? (
            <Text className="text-sm text-card-lighter-2">
              This short task does not award Play Points.
            </Text>
          ) : (
            goal.reward.milestones.map((milestone, index) => {
              const percentage = milestone.triggerPercentage ?? 20
              const previousPercentage =
                index > 0
                  ? (goal.reward.milestones[index - 1]?.triggerPercentage ?? 0)
                  : 0
              const color = seededColor(JSON.stringify(milestone))

              const relativePercentage = Math.round(
                Math.min(
                  Math.max(
                    ((goal.progress.percentage - previousPercentage) /
                      Math.max(percentage - previousPercentage, 1)) *
                      100,
                    0,
                  ),
                  100,
                ),
              )
              const milestoneStarted =
                goal.progress.percentage >= previousPercentage

              return (
                <View
                  className="relative flex-row items-center justify-between overflow-hidden rounded-md bg-card-light-50 p-3 pb-4"
                  key={milestone.id}
                >
                  <View
                    className="absolute bottom-0 left-0 h-1"
                    style={{
                      backgroundColor: color,
                      width: `${milestoneStarted ? relativePercentage : 0}%`,
                    }}
                  />
                  <View className="z-10 flex-row items-center gap-2">
                    <RiCheckLine
                      className={
                        milestone.status === 'LOCKED'
                          ? 'text-card-lighter'
                          : 'text-green-400'
                      }
                      size={16}
                    />
                    <Text className="font-bold text-white">
                      {milestone.name}
                      {milestoneStarted ? ` - ${relativePercentage}%` : ''}
                    </Text>
                  </View>
                  <Text className="z-10 text-sm text-card-lighter-2">
                    +{milestone.points.toFixed(2)}
                  </Text>
                </View>
              )
            })
          )}
        </View>
      ) : null}

      <TaskTimeline goal={goal} active={activeTab === 'timeline'} />

      {activeTab === 'review' && ended && goal.conclusion ? (
        <View className="space-y-4 rounded-2xl bg-cardd p-4">
          <View>
            <View className="flex-row items-center justify-between gap-3">
              <Text className="font-bold">Conclusion</Text>
              {reviewSaved ? (
                <Text className="text-xs font-bold text-success-green">
                  Review saved
                </Text>
              ) : null}
            </View>
            <Text className="text-sm text-card-lighter-2">
              {goal.conclusion.completedOccurrences} completed ·{' '}
              {goal.conclusion.missedOccurrences} missed ·{' '}
              {goal.conclusion.durationDays} days
            </Text>
          </View>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                className={cn(
                  'size-9 items-center justify-center rounded-full',
                  rating === value ? 'bg-card-lighter-3' : 'bg-card-light',
                )}
                key={value}
                onPress={() => setRating(value)}
              >
                <Text
                  className={rating === value ? 'text-black' : 'text-white'}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextArea
            placeholder="What happened? What did you learn?"
            rows={4}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
          />
          <TextArea
            placeholder="What comes next?"
            rows={2}
            value={nextStep}
            onChange={(event) => setNextStep(event.target.value)}
          />
          <AttachmentPicker
            attachments={reviewAttachments}
            maxAttachments={5}
            onAttachmentsChange={setReviewAttachments}
          />
          {reviewSaved ? (
            <View className="rounded-xl bg-card-light px-3 py-2">
              <Text className="text-xs leading-4 text-card-lighter-2">
                This reflection is part of the task’s history and can still be
                edited.
              </Text>
            </View>
          ) : null}
          <Button
            fullWidth
            label={reviewSaved ? 'Update review' : 'Save review'}
            loading={saveReview.isPending}
            onClick={saveConclusionReview}
          />
        </View>
      ) : activeTab === 'review' ? (
        <View className="rounded-2xl bg-card-light-50 p-5">
          <Text className="font-bold">Review after you finish</Text>
          <Text className="mt-2 text-sm leading-6 text-card-lighter-2">
            Your reflection, rating, and next step will appear here when this
            task reaches a conclusion.
          </Text>
        </View>
      ) : null}
      <BottomNotch />
    </View>
  )
}
