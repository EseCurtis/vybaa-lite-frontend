import { RiCheckLine, RiLoader4Line, RiTimeLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
} from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { TextArea } from '@/components/common/textarea.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useRewindRoutine,
  useUpdateRewindRoutine,
} from '@/hooks/use-rewind.hook'
import { useToast } from '@/providers/toast.provider'
import {
  type RewindRoutineFrequency,
  type RewindRoutineIntent,
} from '@/shared/api/rewind.api'
import { getDeviceTimezone } from '@/shared/api/http'
import { colors } from '@/shared/colors.shared'
import { getCustomRewindTimeError } from '@/shared/rewind/rewind-routine.util'
import { cn } from '@/shared/utils/helpers.util'

export type RewindRoutineOrigin = 'rewind' | 'settings'

const DEFAULT_MORNING_TIME = '08:00'
const DEFAULT_EVENING_TIME = '20:00'

const frequencyOptions: Array<{
  description: string
  label: string
  value: RewindRoutineFrequency
}> = [
  {
    description: '08:00 and 20:00',
    label: 'Mornings and evenings',
    value: 'MORNINGS_AND_EVENINGS',
  },
  {
    description: '20:00',
    label: 'Just evenings',
    value: 'JUST_EVENINGS',
  },
  {
    description: '08:00',
    label: 'Just mornings',
    value: 'JUST_MORNINGS',
  },
  {
    description: 'Choose two times',
    label: 'Custom',
    value: 'CUSTOM',
  },
]

const intentOptions: Array<{
  description: string
  label: string
  value: RewindRoutineIntent
}> = [
  {
    description: 'Notice what you are feeling beneath the day.',
    label: 'Understand my emotions',
    value: 'UNDERSTAND_EMOTIONS',
  },
  {
    description: 'Connect recurring moments across your days.',
    label: 'Spot patterns in my days',
    value: 'SPOT_PATTERNS',
  },
  {
    description: 'Turn what you notice into one useful next step.',
    label: 'Turn reflection into small changes',
    value: 'BUILD_SMALL_CHANGES',
  },
  {
    description: 'Set a focus that is personal to you.',
    label: 'Custom intention',
    value: 'CUSTOM',
  },
]

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ msg?: string }>(error)) {
    return error.response?.data?.msg ?? error.message
  }
  return error instanceof Error
    ? error.message
    : 'Could not save your Rewind routine.'
}

export function RewindRoutineScreen({
  origin,
}: {
  origin: RewindRoutineOrigin
}): ReactElement {
  const navigate = useNavigate()
  const toast = useToast()
  const routineQuery = useRewindRoutine()
  const updateRoutine = useUpdateRewindRoutine()
  const [frequency, setFrequency] = useState<RewindRoutineFrequency>(
    'MORNINGS_AND_EVENINGS',
  )
  const [intent, setIntent] = useState<RewindRoutineIntent>(
    'UNDERSTAND_EMOTIONS',
  )
  const [times, setTimes] = useState<[string, string]>([
    DEFAULT_MORNING_TIME,
    DEFAULT_EVENING_TIME,
  ])
  const [customIntent, setCustomIntent] = useState('')

  useEffect(() => {
    const routine = routineQuery.data?.routine
    if (!routine) return

    setFrequency(routine.frequency)
    setIntent(routine.intent)
    setCustomIntent(routine.customIntent ?? '')
    if (routine.times.length === 2) {
      setTimes([routine.times[0], routine.times[1]])
    }
  }, [routineQuery.data?.routine])

  const timezone = getDeviceTimezone()
  const timeError = useMemo(
    () => (frequency === 'CUSTOM' ? getCustomRewindTimeError(times) : null),
    [frequency, times],
  )
  const intentError =
    intent === 'CUSTOM' && !customIntent.trim()
      ? 'Add a short intention for your Rewinds.'
      : null
  const canSave = !timeError && !intentError && !updateRoutine.isPending

  const returnToOrigin = useCallback((): void => {
    if (origin === 'settings') {
      void navigate({ replace: true, to: '/app/sub-profile/settings' })
      return
    }

    void navigate({ replace: true, to: '/app/rewind' })
  }, [navigate, origin])

  const handleSave = async (): Promise<void> => {
    if (!canSave) return

    try {
      await updateRoutine.mutateAsync({
        customIntent: intent === 'CUSTOM' ? customIntent.trim() : null,
        frequency,
        intent,
        times: frequency === 'CUSTOM' ? times : undefined,
        timezone,
      })
      toast.success('Rewind routine saved')
      returnToOrigin()
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader canGoBack onBack={returnToOrigin} title="Rewind routine" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-6">
            <View className="gap-1 px-1">
              <Text className="font-bbh text-base font-bold text-white">
                When should Rewind meet you?
              </Text>
              <Text className="muted font-bbh text-xs">
                Each session stays open for one hour.
              </Text>
            </View>

            <View className="gap-2">
              {frequencyOptions.map((option) => {
                const selected = frequency === option.value
                return (
                  <Pressable
                    key={option.value}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3',
                      'flex-row items-center justify-between',
                      selected
                        ? 'border-accent-400 bg-accent-500/15'
                        : 'border-card-light/35 bg-card-light/10',
                    )}
                    onPress={() => setFrequency(option.value)}
                  >
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text className="font-bbh text-sm font-semibold text-white">
                        {option.label}
                      </Text>
                      <Text className="muted font-bbh text-xs">
                        {option.description}
                      </Text>
                    </View>
                    {selected ? (
                      <View className="size-6 items-center justify-center rounded-full bg-accent-400">
                        <RiCheckLine size={15} className="text-white" />
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}
            </View>

            {frequency === 'CUSTOM' ? (
              <View className="gap-2">
                <Text className="font-bbh text-sm font-semibold text-white">
                  Your two times
                </Text>
                <View className="flex-row gap-3">
                  {times.map((time, index) => (
                    <View
                      key={index}
                      className="flex-1 rounded-2xl bg-card-light/10 px-3 py-3"
                    >
                      <Text className="muted font-bbh text-[10px] uppercase tracking-[0.14em]">
                        {index === 0 ? 'First Rewind' : 'Second Rewind'}
                      </Text>
                      <View className="mt-2 flex-row items-center gap-2">
                        <RiTimeLine size={16} className="text-card-lighter-3" />
                        <input
                          aria-label={
                            index === 0
                              ? 'First Rewind time'
                              : 'Second Rewind time'
                          }
                          className="min-w-0 w-full bg-transparent font-bbh text-base text-white outline-none"
                          onChange={(event) => {
                            const nextTimes: [string, string] = [...times] as [
                              string,
                              string,
                            ]
                            nextTimes[index] = event.target.value
                            setTimes(nextTimes)
                          }}
                          type="time"
                          value={time}
                        />
                      </View>
                    </View>
                  ))}
                </View>
                <Text
                  className={cn(
                    'font-bbh text-xs',
                    timeError ? 'text-danger-400' : 'muted',
                  )}
                >
                  {timeError ??
                    'Keep at least eight hours between both windows.'}
                </Text>
              </View>
            ) : null}

            <View className="gap-2">
              <View className="gap-1">
                <Text className="font-bbh text-sm font-semibold text-white">
                  What do you want to get from Rewind?
                </Text>
                <Text className="muted font-bbh text-xs">
                  This guides your partner&apos;s focus.
                </Text>
              </View>
              {intentOptions.map((option) => {
                const selected = intent === option.value
                return (
                  <Pressable
                    key={option.value}
                    className={cn(
                      'w-full rounded-2xl border px-4 py-3',
                      selected
                        ? 'border-accent-400 bg-accent-500/15'
                        : 'border-card-light/35 bg-card-light/10',
                    )}
                    onPress={() => setIntent(option.value)}
                  >
                    <Text className="font-bbh text-sm font-semibold text-white">
                      {option.label}
                    </Text>
                    <Text className="muted mt-0.5 font-bbh text-xs">
                      {option.description}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {intent === 'CUSTOM' ? (
              <View className="rounded-2xl bg-card-light/10 px-2 py-2">
                <TextArea
                  maxLength={240}
                  onChange={(event) => setCustomIntent(event.target.value)}
                  placeholder="For example: notice when I feel most like myself."
                  value={customIntent}
                />
                {intentError ? (
                  <Text className="px-3 pb-2 font-bbh text-xs text-danger-400">
                    {intentError}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View className="rounded-2xl bg-card-light/10 px-4 py-3">
              <Text className="muted font-bbh text-xs">
                Times use {timezone}.
              </Text>
            </View>

            <Pressable
              className="min-h-12 w-full flex-row items-center justify-center gap-2 rounded-full bg-white disabled:opacity-45"
              disabled={!canSave}
              onPress={() => {
                void handleSave()
              }}
            >
              {updateRoutine.isPending ? (
                <RiLoader4Line size={18} className="animate-spin text-cardd" />
              ) : null}
              <Text className="font-bbh font-bold text-cardd">
                {updateRoutine.isPending ? 'Saving routine...' : 'Save routine'}
              </Text>
            </Pressable>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}

export default RewindRoutineScreen
