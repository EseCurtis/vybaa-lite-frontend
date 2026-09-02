import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { TimeField } from '@/components/common/time-field.component'
import { Button } from '@/components/layout/button.component'
import { useKeyboard } from '@/components/layout/keyboard-avoiding-view.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useToast } from '@/providers/toast.provider'
import type {
  CreateGoalRequest,
  GoalMissMode,
  GoalSchedule,
  GoalTarget,
} from '@/shared/api/goal.api'
import { randomCreateGoalPlaceholder } from '@/shared/goal/goal.util.shared'
import { cn } from '@/shared/utils/helpers.util'
import * as Tooltip from '@radix-ui/react-tooltip'
import { RiLoader4Line } from '@remixicon/react'
import { InfoIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface CreateGoalSheetProps {
  initialValues?: Partial<CreateGoalRequest>
  onSuccess?: () => void
}

type TargetChoice = GoalTarget['type']
type ScheduleChoice = GoalSchedule['type']

const GOAL_CREATION_DRAFT_KEY = 'goal:create-draft:v2'

interface GoalCreationDraft {
  breakStreakOnMiss: boolean
  description: string
  endDate: string
  forfeitPendingOnMiss: boolean
  graceHours: string
  maxConsecutiveMisses: string
  missMode: GoalMissMode
  releaseImmediately: boolean
  reminders: string[]
  scheduleType: ScheduleChoice
  selectedWeekdays: number[]
  startDate: string
  step: 1 | 2 | 3
  targetType: TargetChoice
  targetValue: string
  title: string
  unit: string
  weeklyDay: number
}

function readGoalCreationDraft(): GoalCreationDraft | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = window.localStorage.getItem(GOAL_CREATION_DRAFT_KEY)
    if (!raw) return undefined
    const value: unknown = JSON.parse(raw)
    return value && typeof value === 'object'
      ? (value as GoalCreationDraft)
      : undefined
  } catch {
    return undefined
  }
}

function clearGoalCreationDraft(): void {
  try {
    window.localStorage.removeItem(GOAL_CREATION_DRAFT_KEY)
  } catch {
    // Storage can be unavailable in private browsing; the in-memory form still works.
  }
}

const weekdays = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 7 },
]

function todayKey(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function formatDateLabel(value: string): string {
  const today = todayKey()
  if (value === today) return 'Today'
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function dateKeyFromDate(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function addCalendarDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T12:00:00`)
  date.setDate(date.getDate() + days)
  return dateKeyFromDate(date)
}

function deriveCheckInEndDate(
  startDate: string,
  targetCount: number,
  scheduleType: ScheduleChoice,
  selectedWeekdays: number[],
  weeklyDay: number,
): string | null {
  if (!startDate || !Number.isInteger(targetCount) || targetCount < 1) {
    return null
  }
  if (scheduleType === 'DAILY') {
    return addCalendarDays(startDate, targetCount - 1)
  }
  if (scheduleType === 'WEEKLY') {
    const start = new Date(`${startDate}T12:00:00`)
    const startWeekday = start.getDay() === 0 ? 7 : start.getDay()
    const offset = (weeklyDay - startWeekday + 7) % 7
    return addCalendarDays(startDate, offset + (targetCount - 1) * 7)
  }
  if (scheduleType !== 'SELECTED_WEEKDAYS' || selectedWeekdays.length === 0) {
    return null
  }
  const cursor = new Date(`${startDate}T12:00:00`)
  let completed = 0
  for (let day = 0; day <= 365; day += 1) {
    const weekday = cursor.getDay() === 0 ? 7 : cursor.getDay()
    if (selectedWeekdays.includes(weekday)) {
      completed += 1
      if (completed === targetCount) return dateKeyFromDate(cursor)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return null
}

function progressInfo(
  targetType: TargetChoice,
  targetValue: string,
  unit: string,
  endDate: string,
): { body: string; title: string } {
  if (targetType === 'CHECK_IN_COUNT') {
    const count = Number(targetValue)
    const target =
      Number.isFinite(count) && count > 0
        ? `${count} check-ins`
        : 'your chosen number of check-ins'
    return {
      body: `Each time you complete the activity, you will tap Check in. Your goal will stay active until you reach ${target}; missed days are kept in your history and handled by your goal settings.`,
      title: 'A simple completion signal',
    }
  }
  if (targetType === 'QUANTITY') {
    const amount = Number(targetValue)
    const target =
      Number.isFinite(amount) && amount > 0
        ? amount.toLocaleString()
        : 'your chosen amount'
    const selectedUnit = unit.trim() || 'units'
    return {
      body: `On each scheduled day, you can record how much you completed. Progress adds up toward ${target} ${selectedUnit}, so doing more than the target still counts toward the same finish line.`,
      title: 'Progress that adds up',
    }
  }
  return {
    body: endDate
      ? `This is a single finish line: complete the activity by ${formatDateLabel(endDate)}. There is no repeating check-in target after that date.`
      : 'This is a single finish line. Choose the date you want to complete the activity by, and the goal will close when that date arrives.',
    title: 'One clear finish line',
  }
}

function ChoicePressable({
  active,
  description,
  label,
  onPress,
  className,
}: {
  active: boolean
  description?: string
  label: string
  onPress: () => void
  className?: string
}) {
  return (
    <Pressable
      className={cn(
        description ? 'w-full rounded-2xl px-4 py-3' : 'rounded-full px-3 py-2',
        active ? 'bg-white' : 'bg-card-light-50',
        'flex flex-row items-center justify-between',
        className,
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          'text-sm font-bold',
          active ? 'text-black' : 'text-card-lighter-2',
        )}
      >
        {label}
      </Text>
      {description ? (
        <Text
          className={cn(
            'mt-0.5 text-xs',
            active ? 'text-black/60' : 'text-card-lighter-2',
          )}
        >
          {description}
        </Text>
      ) : null}
    </Pressable>
  )
}

interface CustomizeValues {
  breakStreakOnMiss: boolean
  forfeitPendingOnMiss: boolean
  graceHours: string
  maxConsecutiveMisses: string
  missMode: GoalMissMode
  releaseImmediately: boolean
}

interface CustomizeRulesSheetProps extends CustomizeValues {
  onDone: (values: CustomizeValues) => void
}

interface ReminderSheetProps {
  initialReminders: string[]
  onDone: (reminders: string[]) => void
}

function ReminderSheet({ initialReminders, onDone }: ReminderSheetProps) {
  const [reminders, setReminders] = useState(initialReminders)

  function addReminder(): void {
    if (reminders.length >= 3) return
    setReminders([...reminders, '09:00'])
  }

  return (
    <View className="space-y-5 pb-4">
      <View>
        <Text className="mt-1 text-sm text-card-lighter-2">
          Repeat automatically with your routine.
        </Text>
      </View>
      {reminders.map((reminder, index) => (
        <View
          className="flex-row items-center gap-3"
          key={`${index}-${reminder}`}
        >
          <View className="flex-1">
            <TimeField
              value={reminder}
              onChange={(value) =>
                setReminders(
                  reminders.map((item, itemIndex) =>
                    itemIndex === index ? value : item,
                  ),
                )
              }
            />
          </View>
          <Pressable
            accessibilityLabel={`Remove reminder ${index + 1}`}
            className="size-11 items-center justify-center rounded-full bg-red-500/20"
            onPress={() =>
              setReminders(
                reminders.filter((_, itemIndex) => itemIndex !== index),
              )
            }
          >
            <Text className="text-red-500">×</Text>
          </Pressable>
        </View>
      ))}
      {reminders.length < 3 ? (
        <Pressable
          className="rounded-xl bg-card-light-50 p-3 mx-auto"
          onPress={addReminder}
        >
          <Text className="text-center font-bold">
            + Add {reminders.length > 0 && 'another'} reminder
          </Text>
        </Pressable>
      ) : null}
      <Button fullWidth label="Done" onClick={() => onDone(reminders)} />
    </View>
  )
}

interface DateSheetProps {
  initialDate: string
  minDate?: string
  onDone: (date: string) => void
  title?: string
}

function DateSheet({ initialDate, minDate, onDone, title }: DateSheetProps) {
  const [date, setDate] = useState(initialDate)
  return (
    <View className="space-y-5 pb-4">
      {title ? <Text className="text-lg font-bold">{title}</Text> : null}
      <Input
        autoFocus
        min={minDate}
        type="date"
        value={date}
        onChange={(event) => setDate(event.target.value)}
      />
      <Button fullWidth label="Done" onClick={() => onDone(date)} />
    </View>
  )
}

function InfoHint({ label, text }: { label: string; text: string }) {
  return (
    <Tooltip.Provider delayDuration={250}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Pressable
            accessibilityLabel={`More information about ${label}`}
            className="size-6 items-center justify-center rounded-full"
          >
            <InfoIcon className="text-card-lighter-2" size={15} />
          </Pressable>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-[1000002] max-w-[min(17rem,calc(100vw-2rem))] rounded-xl bg-card-light p-3 text-card-lighter-2 shadow-xl"
            sideOffset={6}
            collisionPadding={12}
          >
            <Text className="text-xs leading-4 text-card-lighter-2">
              {text}
            </Text>
            <Tooltip.Arrow className="fill-card-light" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

function CustomizeRulesSheet({
  breakStreakOnMiss: initialBreakStreak,
  forfeitPendingOnMiss: initialForfeitPending,
  graceHours: initialGraceHours,
  maxConsecutiveMisses: initialMaxConsecutiveMisses,
  missMode: initialMissMode,
  onDone,
  releaseImmediately: initialReleaseImmediately,
}: CustomizeRulesSheetProps) {
  const [missMode, setMissMode] = useState(initialMissMode)
  const [releaseImmediately, setReleaseImmediately] = useState(
    initialReleaseImmediately,
  )
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [graceHours, setGraceHours] = useState(initialGraceHours)
  const [breakStreakOnMiss, setBreakStreakOnMiss] = useState(initialBreakStreak)
  const [forfeitPendingOnMiss, setForfeitPendingOnMiss] = useState(
    initialForfeitPending,
  )
  const [maxConsecutiveMisses, setMaxConsecutiveMisses] = useState(
    initialMaxConsecutiveMisses,
  )

  return (
    <View className="space-y-5 pb-4 ">
      <View>
        <Text className="mt-1 text-sm leading-5 text-card-lighter-2">
          Choose a simple miss policy. You can refine it below.
        </Text>
      </View>
      <View className="space-y-2">
        <Text className="text-xs hidden text-card-lighter-2">When I miss</Text>
        <View className="grid grid-cols-3 flex-wrap gap-2 w-full bg-cardd p-1 rounded-full">
          {(['STRICT', 'FLEXIBLE', 'NO_STREAK'] as GoalMissMode[]).map(
            (mode) => (
              <ChoicePressable
                key={mode}
                active={missMode === mode}
                label={
                  mode === 'NO_STREAK'
                    ? 'No streak'
                    : mode[0] + mode.slice(1).toLowerCase()
                }
                className="!justify-center py-3"
                onPress={() => {
                  setMissMode(mode)
                  setGraceHours(mode === 'FLEXIBLE' ? '24' : '0')
                  setBreakStreakOnMiss(mode === 'STRICT')
                  setForfeitPendingOnMiss(mode === 'STRICT')
                }}
              />
            ),
          )}
        </View>
      </View>
      <Pressable
        className="flex-row flex text-left items-center justify-between rounded-2xl bg-cardd p-4"
        onPress={() => setReleaseImmediately(!releaseImmediately)}
      >
        <View className="flex-1 pr-3">
          <Text className="font-bold">Release immediately</Text>
          <Text className="mt-1 text-xs text-card-lighter-2">
            Otherwise points wait until you complete the goal.
          </Text>
        </View>
        <View
          className={cn(
            'h-7 w-12 rounded-full p-1',
            releaseImmediately ? 'bg-green-500' : 'bg-card-lighter',
          )}
        >
          <View
            className={cn(
              'size-5 rounded-full bg-white',
              releaseImmediately ? 'ml-5' : '',
            )}
          />
        </View>
      </Pressable>
      <Pressable
        className="rounded-2xl flex flex-col text-left bg-cardd p-4"
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <Text className="font-bold">Advanced miss rules</Text>
        <Text className="mt-1 text-xs text-card-lighter-2">
          Grace period, streak behavior, and auto-abandon.
        </Text>
      </Pressable>
      {showAdvanced ? (
        <View className="space-y-4 rounded-2xl bg-card-light-50 p-4">
          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1">
                <Text className="text-sm font-bold">Make-up window</Text>
                <InfoHint
                  label="make-up window"
                  text="The number of hours after a missed day when you can still check in and keep your streak."
                />
              </View>
              <Text className="text-xs text-card-lighter-2">Hours</Text>
            </View>
            <Input
              max={48}
              min={0}
              type="number"
              value={graceHours}
              onChange={(event) => setGraceHours(event.target.value)}
              className="bg-cardd"
            />
          </View>
          <View className="space-y-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <View className="flex-row items-center gap-1">
                  <Text className="text-sm font-bold">
                    Stop after repeated misses
                  </Text>
                  <InfoHint
                    label="stop after repeated misses"
                    text="Set a number to automatically end this goal after that many consecutive missed occurrences. Leave it empty to never use this rule."
                  />
                </View>
              </View>
              <Text className="text-xs text-card-lighter-2">Misses</Text>
            </View>
            <Input
              max={365}
              min={1}
              placeholder="Never"
              type="number"
              value={maxConsecutiveMisses}
              onChange={(event) => setMaxConsecutiveMisses(event.target.value)}
              className="bg-cardd"
            />
            <View className="rounded-xl bg-warning-yellow/20 px-3 py-2">
              <Text className="text-xs text-warning-yellow/90">
                {maxConsecutiveMisses
                  ? `This goal will end after ${maxConsecutiveMisses} consecutive ${Number(maxConsecutiveMisses) === 1 ? 'miss' : 'misses'}.`
                  : 'Leave empty to keep the goal active until its deadline or maximum duration.'}
              </Text>
            </View>
          </View>
          <View>
            <Text className="mb-2 text-xs text-card-lighter-2">
              Break streak on a final miss?
            </Text>
            <View className="flex-row gap-2 bg-cardd p-1 rounded-full  mr-auto">
              <ChoicePressable
                active={breakStreakOnMiss}
                label="Yes"
                onPress={() => setBreakStreakOnMiss(true)}
              />
              <ChoicePressable
                active={!breakStreakOnMiss}
                label="No"
                onPress={() => setBreakStreakOnMiss(false)}
              />
            </View>
          </View>
          <View>
            <Text className="mb-2 text-xs text-card-lighter-2">
              Forfeit held rewards on a final miss?
            </Text>
            <View className="flex-row gap-2 bg-cardd p-1 rounded-full mr-auto">
              <ChoicePressable
                active={forfeitPendingOnMiss}
                label="Yes"
                onPress={() => setForfeitPendingOnMiss(true)}
              />
              <ChoicePressable
                active={!forfeitPendingOnMiss}
                label="No"
                onPress={() => setForfeitPendingOnMiss(false)}
              />
            </View>
          </View>
        </View>
      ) : null}
      <Button
        fullWidth
        label="Done"
        onClick={() =>
          onDone({
            breakStreakOnMiss,
            forfeitPendingOnMiss,
            graceHours,
            maxConsecutiveMisses,
            missMode,
            releaseImmediately,
          })
        }
      />
    </View>
  )
}

export function CreateGoalSheet({
  initialValues,
  onSuccess,
}: CreateGoalSheetProps) {
  const toast = useToast()
  const { handleSubscriptionError } = useProAccess()
  const { isKeyboardVisible, keyboardHeight } = useKeyboard()
  const createGoal = useCreateGoal()
  const bottomSheet = useBottomSheetController()
  const [savedDraft] = useState(readGoalCreationDraft)
  const draftValues = initialValues?.sourceRecommendationId
    ? initialValues
    : undefined
  const initialTarget = draftValues?.target ?? initialValues?.target
  const initialSchedule = draftValues?.schedule ?? initialValues?.schedule
  const [step, setStep] = useState<1 | 2 | 3>(savedDraft?.step ?? 1)
  const [title, setTitle] = useState(
    draftValues?.title ?? savedDraft?.title ?? initialValues?.title ?? '',
  )
  const [description, setDescription] = useState(
    draftValues?.description ??
      savedDraft?.description ??
      initialValues?.description ??
      '',
  )
  const [showReason, setShowReason] = useState(
    Boolean(
      draftValues?.description ??
      savedDraft?.description ??
      initialValues?.description,
    ),
  )
  const [targetType, setTargetType] = useState<TargetChoice>(
    savedDraft?.targetType ?? initialTarget?.type ?? 'CHECK_IN_COUNT',
  )
  const [targetValue, setTargetValue] = useState(
    savedDraft?.targetValue ??
      String(
        initialTarget?.type === 'QUANTITY'
          ? initialTarget.amount
          : initialTarget?.type === 'CHECK_IN_COUNT'
            ? initialTarget.count
            : 7,
      ),
  )
  const [unit, setUnit] = useState(
    savedDraft?.unit ??
      (initialTarget?.type === 'QUANTITY'
        ? (initialTarget.unit ?? 'times')
        : 'times'),
  )
  const [scheduleType, setScheduleType] = useState<ScheduleChoice>(
    savedDraft?.scheduleType ?? initialSchedule?.type ?? 'DAILY',
  )
  const [startDate, setStartDate] = useState(
    savedDraft?.startDate ??
      (initialSchedule?.type === 'ONE_TIME'
        ? initialSchedule.date
        : (initialSchedule?.startDate ?? todayKey())),
  )
  const initialEndDate =
    initialTarget?.type === 'UNTIL_DATE'
      ? (initialTarget.endDate ?? '')
      : initialSchedule && initialSchedule.type !== 'ONE_TIME'
        ? (initialSchedule.endDate ?? '')
        : ''
  const [endDate, setEndDate] = useState(savedDraft?.endDate ?? initialEndDate)
  // An explicit incoming or user-entered date is a deliberate override. Automatic
  // calculations may only update dates that have never been manually edited.
  const [endDateManuallySet, setEndDateManuallySet] = useState(
    Boolean(savedDraft?.endDate ?? initialEndDate),
  )
  const [selectedWeekdays, setSelectedWeekdays] = useState(
    savedDraft?.selectedWeekdays ??
      (initialSchedule?.type === 'SELECTED_WEEKDAYS'
        ? initialSchedule.weekdays
        : [1, 2, 3, 4, 5]),
  )
  const [weeklyDay, setWeeklyDay] = useState(
    savedDraft?.weeklyDay ??
      (initialSchedule?.type === 'WEEKLY' ? initialSchedule.weekday : 1),
  )
  const [reminders, setReminders] = useState<string[]>(
    savedDraft?.reminders ??
      draftValues?.reminderTimes ??
      initialValues?.reminderTimes ??
      [],
  )
  const [missMode, setMissMode] = useState<GoalMissMode>(
    savedDraft?.missMode ?? 'STRICT',
  )
  const [releaseImmediately, setReleaseImmediately] = useState(
    savedDraft?.releaseImmediately ?? false,
  )
  const [graceHours, setGraceHours] = useState(savedDraft?.graceHours ?? '0')
  const [breakStreakOnMiss, setBreakStreakOnMiss] = useState(
    savedDraft?.breakStreakOnMiss ?? true,
  )
  const [forfeitPendingOnMiss, setForfeitPendingOnMiss] = useState(
    savedDraft?.forfeitPendingOnMiss ?? true,
  )
  const [maxConsecutiveMisses, setMaxConsecutiveMisses] = useState(
    savedDraft?.maxConsecutiveMisses ?? '',
  )

  function setManualEndDate(date: string): void {
    setEndDate(date)
    setEndDateManuallySet(true)
  }

  useEffect(() => {
    try {
      window.localStorage.setItem(
        GOAL_CREATION_DRAFT_KEY,
        JSON.stringify({
          breakStreakOnMiss,
          description,
          endDate,
          forfeitPendingOnMiss,
          graceHours,
          maxConsecutiveMisses,
          missMode,
          releaseImmediately,
          reminders,
          scheduleType,
          selectedWeekdays,
          startDate,
          step,
          targetType,
          targetValue,
          title,
          unit,
          weeklyDay,
        } satisfies GoalCreationDraft),
      )
    } catch {
      // Storage can be unavailable; keep the draft in component state.
    }
  }, [
    breakStreakOnMiss,
    description,
    endDate,
    forfeitPendingOnMiss,
    graceHours,
    maxConsecutiveMisses,
    missMode,
    releaseImmediately,
    reminders,
    scheduleType,
    selectedWeekdays,
    startDate,
    step,
    targetType,
    targetValue,
    title,
    unit,
    weeklyDay,
  ])

  useEffect(() => {
    if (endDateManuallySet || targetType !== 'CHECK_IN_COUNT') return
    const count = Number(targetValue)
    const derived = deriveCheckInEndDate(
      startDate,
      count,
      scheduleType,
      selectedWeekdays,
      weeklyDay,
    )
    if (derived && derived !== endDate) setEndDate(derived)
  }, [
    endDate,
    endDateManuallySet,
    scheduleType,
    selectedWeekdays,
    startDate,
    targetType,
    targetValue,
    weeklyDay,
  ])

  function buildTarget(): GoalTarget | null {
    if (targetType === 'UNTIL_DATE') {
      return endDate ? { endDate, type: 'UNTIL_DATE' } : null
    }
    const value = Number(targetValue)
    if (!Number.isFinite(value) || value <= 0) return null
    if (targetType === 'QUANTITY') {
      return unit.trim()
        ? { amount: value, type: 'QUANTITY', unit: unit.trim() }
        : null
    }
    return Number.isInteger(value) && value <= 365
      ? { count: value, type: 'CHECK_IN_COUNT' }
      : null
  }

  function buildSchedule(): GoalSchedule | null {
    if (scheduleType === 'ONE_TIME') {
      return startDate ? { date: startDate, type: 'ONE_TIME' } : null
    }
    if (scheduleType === 'WEEKLY') {
      return { startDate, type: 'WEEKLY', weekday: weeklyDay }
    }
    if (scheduleType === 'SELECTED_WEEKDAYS') {
      return selectedWeekdays.length
        ? { startDate, type: 'SELECTED_WEEKDAYS', weekdays: selectedWeekdays }
        : null
    }
    return { startDate, type: 'DAILY' }
  }

  async function handleSubmit(): Promise<void> {
    const target = buildTarget()
    const schedule = buildSchedule()
    if (!title.trim()) {
      toast.warning('Give your goal a clear title')
      return
    }
    if (!target) {
      toast.warning('Add a valid success target')
      return
    }
    if (!schedule) {
      toast.warning('Choose a valid schedule')
      return
    }
    const payload: CreateGoalRequest = {
      description: description.trim() || undefined,
      hardStopDate:
        target.type !== 'UNTIL_DATE' && endDate ? endDate : undefined,
      missPolicy: {
        mode: missMode,
        breakStreakOnMiss,
        forfeitPendingOnMiss,
        graceHours: Number(graceHours),
        maxConsecutiveMisses: maxConsecutiveMisses
          ? Number(maxConsecutiveMisses)
          : null,
      },
      reminderTimes: reminders.filter(Boolean),
      rewardReleasePolicy: releaseImmediately ? 'IMMEDIATE' : 'ON_COMPLETION',
      schedule,
      sourceRecommendationId: initialValues?.sourceRecommendationId,
      target,
      title: title.trim(),
    }
    const submit = async (): Promise<void> => {
      await createGoal.mutateAsync(payload)
      clearGoalCreationDraft()
      onSuccess?.()
    }
    try {
      await submit()
    } catch (error: unknown) {
      await handleSubscriptionError(error, submit)
    }
  }

  function handleContinue(): void {
    if (step === 1 && !title.trim()) {
      toast.warning('Give your goal a clear title')
      return
    }
    if (step === 2 && !buildTarget()) {
      toast.warning('Choose how you will track progress')
      return
    }
    setStep((current) => (current === 3 ? 3 : ((current + 1) as 2 | 3)))
  }

  const progressExplanation = progressInfo(
    targetType,
    targetValue,
    unit,
    endDate,
  )

  return (
    <View className="space-y-6 pb-24 ">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold">
          {step === 1
            ? 'What do you want to do?'
            : step === 2
              ? 'How will you track progress?'
              : 'When will you do it?'}
        </Text>
        <Text className="text-xs font-bold text-card-lighter-2">
          {step} of 3
        </Text>
      </View>

      {step === 1 ? (
        <View className="space-y-3">
          <Input
            autoFocus
            maxLength={500}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={`e.g ${randomCreateGoalPlaceholder()}`}
            value={title}
          />
          {!showReason ? (
            <Pressable onPress={() => setShowReason(true)}>
              <Text className="font-bold mx-auto my-3 bg-cardx text-card-lighter-3">
                + Add a reason
              </Text>
            </Pressable>
          ) : (
            <View className="space-y-2">
              <Text className="text-xs text-card-lighter-2">Reason</Text>
              <TextArea
                maxLength={2000}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Why does this matter to you?"
                className="min-h-[72px]"
                rows={2}
                value={description}
              />

              <Pressable onPress={() => setShowReason(false)}>
                <Text className="font-bold mx-auto my-3 bg-cardx text-card-lighter-3">
                  Clear
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : null}

      {step === 2 ? (
        <View className="space-y-4">
          <View className="space-y-2">
            <ChoicePressable
              active={targetType === 'CHECK_IN_COUNT'}
              description="Mark it done each time"
              label="Check in"
              onPress={() => setTargetType('CHECK_IN_COUNT')}
            />
            <ChoicePressable
              active={targetType === 'QUANTITY'}
              description="Track a number"
              label="Count"
              onPress={() => setTargetType('QUANTITY')}
            />
            <ChoicePressable
              active={targetType === 'UNTIL_DATE'}
              description="Complete it by a date"
              label="Finish once"
              onPress={() => setTargetType('UNTIL_DATE')}
            />
          </View>
          {targetType === 'UNTIL_DATE' ? (
            <View className="space-y-2">
              <Text className="text-xs text-card-lighter-2">Finish by</Text>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setManualEndDate(event.target.value)}
              />
            </View>
          ) : (
            <View className="space-y-2">
              <Text className="text-xs text-card-lighter-2">
                {targetType === 'QUANTITY' ? 'Target' : 'Goal target'}
              </Text>
              <View className="flex-row gap-2">
                <Input
                  className="flex-1"
                  min={1}
                  type="number"
                  value={targetValue}
                  onChange={(event) => setTargetValue(event.target.value)}
                />
                {targetType === 'QUANTITY' ? (
                  <Input
                    className="flex-1"
                    placeholder="pages, minutes…"
                    value={unit}
                    onChange={(event) => setUnit(event.target.value)}
                  />
                ) : null}
              </View>
            </View>
          )}
          <View className="rounded-xl bg-warning-yellow/10 p-4">
            <Text className="text-sm flex items-center font-bold gap-1 text-warning-yellow">
              <InfoIcon size={16} /> {progressExplanation.title}
            </Text>
            <Text className="mt-2 text-sm leading-relaxed text-warning-yellow/90">
              {progressExplanation.body}
            </Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View className="space-y-4">
          <View className="flex-row flex-wrap gap-2">
            <ChoicePressable
              active={scheduleType === 'DAILY'}
              label="Daily"
              onPress={() => setScheduleType('DAILY')}
            />
            <ChoicePressable
              active={scheduleType === 'WEEKLY'}
              label="Weekly"
              onPress={() => setScheduleType('WEEKLY')}
            />
            <ChoicePressable
              active={scheduleType === 'SELECTED_WEEKDAYS'}
              label="Custom"
              onPress={() => setScheduleType('SELECTED_WEEKDAYS')}
            />
            <ChoicePressable
              active={scheduleType === 'ONE_TIME'}
              label="One-time"
              onPress={() => setScheduleType('ONE_TIME')}
            />
          </View>
          <Pressable
            className="flex-row items-center justify-between rounded-xl bg-card-light-50 p-4"
            onPress={() =>
              bottomSheet.present(
                <DateSheet
                  initialDate={startDate}
                  onDone={(date) => {
                    setStartDate(date)
                    bottomSheet.dismiss()
                  }}
                />,
                { title: 'Start date' },
              )
            }
          >
            <View>
              <Text className="text-xs text-card-lighter-2">Starts</Text>
              <Text className="mt-1 font-bold">
                {formatDateLabel(startDate)}
              </Text>
            </View>
            <Text className="text-card-lighter-2">›</Text>
          </Pressable>
          {scheduleType === 'WEEKLY' || scheduleType === 'SELECTED_WEEKDAYS' ? (
            <View className="flex-row gap-1 mx-auto">
              {weekdays.map((day) => {
                const active =
                  scheduleType === 'WEEKLY'
                    ? weeklyDay === day.value
                    : selectedWeekdays.includes(day.value)
                return (
                  <Pressable
                    key={day.value}
                    className={cn(
                      'size-9 items-center justify-center rounded-full',
                      active ? 'bg-card-lighter-3' : 'bg-card-light-50',
                    )}
                    onPress={() => {
                      if (scheduleType === 'WEEKLY') {
                        setWeeklyDay(day.value)
                        return
                      }
                      setSelectedWeekdays(
                        active
                          ? selectedWeekdays.filter(
                              (value) => value !== day.value,
                            )
                          : [...selectedWeekdays, day.value].sort(),
                      )
                    }}
                  >
                    <Text
                      className={active ? 'text-black' : 'text-card-lighter-2'}
                    >
                      {day.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}
          {targetType !== 'UNTIL_DATE' && scheduleType !== 'ONE_TIME' ? (
            <View>
              {!endDate ? (
                <Pressable
                  onPress={() =>
                    bottomSheet.present(
                      <DateSheet
                        initialDate={startDate}
                        minDate={startDate}
                        onDone={(date) => {
                          setManualEndDate(date)
                          bottomSheet.dismiss()
                        }}
                      />,
                      { title: 'End date' },
                    )
                  }
                  className="mx-auto"
                >
                  <Text className="font-bold text-card-lighter-3">
                    + Add end date
                  </Text>
                </Pressable>
              ) : (
                <View className="">
                  <Pressable
                    className="flex-row items-center justify-between rounded-xl bg-card-light-50 p-4"
                    onPress={() =>
                      bottomSheet.present(
                        <DateSheet
                          initialDate={endDate}
                          minDate={startDate}
                          onDone={(date) => {
                            setManualEndDate(date)
                            bottomSheet.dismiss()
                          }}
                          title="End date"
                        />,
                        { title: 'End date' },
                      )
                    }
                  >
                    <View>
                      <Text className="text-xs text-card-lighter-2">Ends</Text>
                      <Text className="mt-1 font-bold">
                        {formatDateLabel(endDate)}
                      </Text>
                    </View>
                    <Text className="text-card-lighter-2">›</Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setEndDate('')
                      setEndDateManuallySet(true)
                    }}
                    className="mx-auto py-2"
                  >
                    <Text className="font-bold text-card-lighter-3">
                      clear end date
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <View className="mx-3">
              <Text className="font-bold">Reminder</Text>
              <Text className="mt-1 text-xs text-card-lighter-2">
                {reminders.length
                  ? reminders.map((item) => item).join(', ')
                  : 'Off'}
              </Text>
            </View>
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-card-light-50"
              onPress={() =>
                bottomSheet.present(
                  <ReminderSheet
                    initialReminders={reminders}
                    onDone={(nextReminders) => {
                      setReminders(nextReminders)
                      bottomSheet.dismiss()
                    }}
                  />,
                  { size: 'default', title: 'Reminder' },
                )
              }
            >
              <Text className="text-lg text-card-lighter-2">›</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <Pressable
          className="flex-row items-center justify-between rounded-2xl bg-card-light-50 p-4"
          onPress={() =>
            bottomSheet.present(
              <CustomizeRulesSheet
                breakStreakOnMiss={breakStreakOnMiss}
                forfeitPendingOnMiss={forfeitPendingOnMiss}
                graceHours={graceHours}
                maxConsecutiveMisses={maxConsecutiveMisses}
                missMode={missMode}
                onDone={(values) => {
                  setBreakStreakOnMiss(values.breakStreakOnMiss)
                  setForfeitPendingOnMiss(values.forfeitPendingOnMiss)
                  setGraceHours(values.graceHours)
                  setMaxConsecutiveMisses(values.maxConsecutiveMisses)
                  setMissMode(values.missMode)
                  setReleaseImmediately(values.releaseImmediately)
                  bottomSheet.dismiss()
                }}
                releaseImmediately={releaseImmediately}
              />,
              { size: 'semi-full', title: 'How should this goal feel?' },
            )
          }
        >
          <View className="flex-1 pr-3">
            <Text className="font-bold">Goal settings</Text>
            <Text className="mt-1 text-xs text-card-lighter-2">
              {missMode === 'NO_STREAK'
                ? 'No streak · points on completion'
                : `${missMode === 'FLEXIBLE' ? 'Flexible' : 'Strict'} · ${releaseImmediately ? 'points now' : 'points on completion'}`}
            </Text>
          </View>
          <Text className="text-lg text-card-lighter-2">›</Text>
        </Pressable>
      ) : null}

      <View
        className="fixed bottom-0 left-1/2 z-30 w-full max-w-[400px] -translate-x-1/2 flex-row items-center gap-3 bg-cardd p-mg"
        style={{
          bottom: isKeyboardVisible ? keyboardHeight : 0,
        }}
      >
        {step > 1 ? (
          <Pressable
            className="rounded-full bg-card-light-50 px-5 py-4"
            onPress={() =>
              setStep((current) =>
                current === 1 ? 1 : ((current - 1) as 1 | 2),
              )
            }
          >
            <Text className="font-bold">Back</Text>
          </Pressable>
        ) : null}
        <Pressable
          className="flex-1 disabled:opacity-40 py-4 items-center justify-center rounded-full bg-white px-6"
          disabled={createGoal.isPending || (step === 1 && !title.trim())}
          onPress={step === 3 ? handleSubmit : handleContinue}
        >
          {createGoal.isPending ? (
            <RiLoader4Line className="animate-spin text-black" size={20} />
          ) : (
            <Text className="font-bold text-black">
              {step === 3 ? 'Create goal' : 'Continue'}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}
