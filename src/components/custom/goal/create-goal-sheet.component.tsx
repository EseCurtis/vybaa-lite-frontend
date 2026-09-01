import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { TimeField } from '@/components/common/time-field.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useToast } from '@/providers/toast.provider'
import type {
  CreateGoalRequest,
  GoalMissMode,
  GoalSchedule,
  GoalTarget,
} from '@/shared/api/goal.api'
import { cn } from '@/shared/utils/helpers.util'
import { useState } from 'react'

interface CreateGoalSheetProps {
  initialValues?: Partial<CreateGoalRequest>
  onSuccess?: () => void
}

type TargetChoice = GoalTarget['type']
type ScheduleChoice = GoalSchedule['type']

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

function ChoiceButton({
  active,
  label,
  onPress,
}: {
  active: boolean
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      className={cn(
        'rounded-full px-3 py-2',
        active ? 'bg-card-lighter-3' : 'bg-card-light-50',
      )}
      onPress={onPress}
    >
      <Text
        className={cn(
          'text-xs font-bold',
          active ? 'text-black' : 'text-card-lighter-2',
        )}
      >
        {label}
      </Text>
    </Pressable>
  )
}

export function CreateGoalSheet({
  initialValues,
  onSuccess,
}: CreateGoalSheetProps) {
  const toast = useToast()
  const { handleSubscriptionError } = useProAccess()
  const createGoal = useCreateGoal()
  const initialTarget = initialValues?.target
  const initialSchedule = initialValues?.schedule
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(
    initialValues?.description ?? '',
  )
  const [targetType, setTargetType] = useState<TargetChoice>(
    initialTarget?.type ?? 'CHECK_IN_COUNT',
  )
  const [targetValue, setTargetValue] = useState(
    String(
      initialTarget?.type === 'QUANTITY'
        ? initialTarget.amount
        : initialTarget?.type === 'CHECK_IN_COUNT'
          ? initialTarget.count
          : 7,
    ),
  )
  const [unit, setUnit] = useState(
    initialTarget?.type === 'QUANTITY'
      ? (initialTarget.unit ?? 'times')
      : 'times',
  )
  const [scheduleType, setScheduleType] = useState<ScheduleChoice>(
    initialSchedule?.type ?? 'DAILY',
  )
  const [startDate, setStartDate] = useState(
    initialSchedule?.type === 'ONE_TIME'
      ? initialSchedule.date
      : (initialSchedule?.startDate ?? todayKey()),
  )
  const [endDate, setEndDate] = useState(
    initialTarget?.type === 'UNTIL_DATE'
      ? (initialTarget.endDate ?? '')
      : initialSchedule && initialSchedule.type !== 'ONE_TIME'
        ? (initialSchedule.endDate ?? '')
        : '',
  )
  const [selectedWeekdays, setSelectedWeekdays] = useState(
    initialSchedule?.type === 'SELECTED_WEEKDAYS'
      ? initialSchedule.weekdays
      : [1, 2, 3, 4, 5],
  )
  const [weeklyDay, setWeeklyDay] = useState(
    initialSchedule?.type === 'WEEKLY' ? initialSchedule.weekday : 1,
  )
  const [reminders, setReminders] = useState<string[]>(
    initialValues?.reminderTimes ?? [],
  )
  const [showCustomize, setShowCustomize] = useState(false)
  const [missMode, setMissMode] = useState<GoalMissMode>('STRICT')
  const [releaseImmediately, setReleaseImmediately] = useState(false)
  const [showAdvancedMissRules, setShowAdvancedMissRules] = useState(false)
  const [graceHours, setGraceHours] = useState('0')
  const [breakStreakOnMiss, setBreakStreakOnMiss] = useState(true)
  const [forfeitPendingOnMiss, setForfeitPendingOnMiss] = useState(true)
  const [maxConsecutiveMisses, setMaxConsecutiveMisses] = useState('')

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
        ...(showAdvancedMissRules
          ? {
              breakStreakOnMiss,
              forfeitPendingOnMiss,
              graceHours: Number(graceHours),
              maxConsecutiveMisses: maxConsecutiveMisses
                ? Number(maxConsecutiveMisses)
                : null,
            }
          : {}),
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
      onSuccess?.()
    }
    try {
      await submit()
    } catch (error: unknown) {
      await handleSubscriptionError(error, submit)
    }
  }

  function addReminder(): void {
    if (reminders.length >= 3) return
    setReminders([...reminders, '09:00'])
  }

  return (
    <View className="space-y-5 pb-24">
      <View className="space-y-2">
        <Text className="text-xs text-card-lighter-2">
          What are you working toward?
        </Text>
        <Input
          autoFocus
          maxLength={500}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Read every day"
          value={title}
        />
        <TextArea
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Why this matters (optional)"
          rows={2}
          value={description}
        />
      </View>

      <View className="space-y-2">
        <Text className="text-xs text-card-lighter-2">
          What does success look like?
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ChoiceButton
            active={targetType === 'CHECK_IN_COUNT'}
            label="Check-ins"
            onPress={() => setTargetType('CHECK_IN_COUNT')}
          />
          <ChoiceButton
            active={targetType === 'QUANTITY'}
            label="Quantity"
            onPress={() => setTargetType('QUANTITY')}
          />
          <ChoiceButton
            active={targetType === 'UNTIL_DATE'}
            label="Until a date"
            onPress={() => setTargetType('UNTIL_DATE')}
          />
        </View>
        {targetType === 'UNTIL_DATE' ? (
          <Input
            type="date"
            value={endDate}
            min={startDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        ) : (
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
        )}
      </View>

      <View className="space-y-2">
        <Text className="text-xs text-card-lighter-2">Schedule</Text>
        <View className="flex-row flex-wrap gap-2">
          <ChoiceButton
            active={scheduleType === 'DAILY'}
            label="Daily"
            onPress={() => setScheduleType('DAILY')}
          />
          <ChoiceButton
            active={scheduleType === 'WEEKLY'}
            label="Weekly"
            onPress={() => setScheduleType('WEEKLY')}
          />
          <ChoiceButton
            active={scheduleType === 'SELECTED_WEEKDAYS'}
            label="Choose days"
            onPress={() => setScheduleType('SELECTED_WEEKDAYS')}
          />
          <ChoiceButton
            active={scheduleType === 'ONE_TIME'}
            label="One-time"
            onPress={() => setScheduleType('ONE_TIME')}
          />
        </View>
        <Input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
        {scheduleType === 'WEEKLY' || scheduleType === 'SELECTED_WEEKDAYS' ? (
          <View className="flex-row gap-1">
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
            <Text className="mb-1 text-xs text-card-lighter-2">
              Optional deadline
            </Text>
            <Input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </View>
        ) : null}
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-card-lighter-2">
            Reminders ({reminders.length}/3)
          </Text>
          <Pressable
            className="rounded-full bg-card-light-50 px-3 py-1"
            onPress={addReminder}
            disabled={reminders.length >= 3}
          >
            <Text className="text-xs">Add</Text>
          </Pressable>
        </View>
        {reminders.map((reminder, index) => (
          <View
            className="flex-row items-center gap-2"
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
              onPress={() =>
                setReminders(
                  reminders.filter((_, itemIndex) => itemIndex !== index),
                )
              }
            >
              <Text className="text-danger-400">Remove</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        className="rounded-2xl bg-card-light-50 p-4"
        onPress={() => setShowCustomize(!showCustomize)}
      >
        <Text className="font-bold">Customize rules and rewards</Text>
        <Text className="mt-1 text-xs text-card-lighter-2">
          {showCustomize ? 'Hide options' : 'Miss policy and point release'}
        </Text>
      </Pressable>

      {showCustomize ? (
        <View className="space-y-4 rounded-2xl bg-card-light-50 p-4">
          <View className="space-y-2">
            <Text className="text-xs text-card-lighter-2">When I miss</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['STRICT', 'FLEXIBLE', 'NO_STREAK'] as GoalMissMode[]).map(
                (mode) => (
                  <ChoiceButton
                    key={mode}
                    active={missMode === mode}
                    label={
                      mode === 'NO_STREAK'
                        ? 'No streak'
                        : mode[0] + mode.slice(1).toLowerCase()
                    }
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
            className="flex-row items-center justify-between"
            onPress={() => setReleaseImmediately(!releaseImmediately)}
          >
            <View>
              <Text>Release points immediately</Text>
              <Text className="text-xs text-card-lighter-2">
                Default: hold until completion
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
                  'size-5 rounded-full bg-card-lighter-3',
                  releaseImmediately ? 'ml-5' : '',
                )}
              />
            </View>
          </Pressable>
          <Pressable
            className="rounded-xl bg-card-light p-3"
            onPress={() => setShowAdvancedMissRules(!showAdvancedMissRules)}
          >
            <Text className="text-sm font-bold">Advanced miss overrides</Text>
            <Text className="text-xs text-card-lighter-2">
              {showAdvancedMissRules
                ? 'Use the controls below'
                : 'Grace, streak, rewards, and auto-abandon'}
            </Text>
          </Pressable>
          {showAdvancedMissRules ? (
            <View className="space-y-3">
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-card-lighter-2">
                    Grace hours
                  </Text>
                  <Input
                    max={48}
                    min={0}
                    type="number"
                    value={graceHours}
                    onChange={(event) => setGraceHours(event.target.value)}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-xs text-card-lighter-2">
                    Auto-abandon after misses
                  </Text>
                  <Input
                    max={365}
                    min={1}
                    placeholder="Never"
                    type="number"
                    value={maxConsecutiveMisses}
                    onChange={(event) =>
                      setMaxConsecutiveMisses(event.target.value)
                    }
                  />
                </View>
              </View>
              <View>
                <Text className="mb-2 text-xs text-card-lighter-2">
                  Break streak on a final miss?
                </Text>
                <View className="flex-row gap-2">
                  <ChoiceButton
                    active={breakStreakOnMiss}
                    label="Yes"
                    onPress={() => setBreakStreakOnMiss(true)}
                  />
                  <ChoiceButton
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
                <View className="flex-row gap-2">
                  <ChoiceButton
                    active={forfeitPendingOnMiss}
                    label="Yes"
                    onPress={() => setForfeitPendingOnMiss(true)}
                  />
                  <ChoiceButton
                    active={!forfeitPendingOnMiss}
                    label="No"
                    onPress={() => setForfeitPendingOnMiss(false)}
                  />
                </View>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <View className="absolute bottom-0 left-0 w-full p-mg">
        <Button
          fullWidth
          label="Create goal"
          loading={createGoal.isPending}
          disabled={createGoal.isPending}
          onClick={handleSubmit}
        />
      </View>
    </View>
  )
}
