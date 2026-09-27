import {
  RiCheckLine,
  RiLoader4Line,
  RiTimeLine,
  RiVipCrownLine,
} from '@remixicon/react'
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
import { useProAccess } from '@/hooks/use-pro-access.hook'
import {
  useRewindRoutine,
  useUpdateRewindRoutine,
} from '@/hooks/use-rewind.hook'
import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import { getDeviceTimezone } from '@/shared/api/http'
import type {
  RewindRoutineFrequency,
  RewindRoutineIntent,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { getCustomRewindTimeError } from '@/shared/rewind/rewind-routine.util'
import { cn } from '@/shared/utils/helpers.util'

export type RewindRoutineOrigin = 'rewind' | 'settings'

type FrequencyOption = {
  detail: string
  label: string
  schedule: string
  value: RewindRoutineFrequency
}

type IntentOption = {
  detail: string
  label: string
  value: RewindRoutineIntent
}

const DEFAULT_MORNING_TIME = '08:00'
const DEFAULT_EVENING_TIME = '20:00'

const frequencyOptions: FrequencyOption[] = [
  {
    detail: 'Two one-hour windows, spaced across the day.',
    label: 'Morning and evening',
    schedule: '08:00 + 20:00',
    value: 'MORNINGS_AND_EVENINGS',
  },
  {
    detail: 'Close the day with one evening reflection.',
    label: 'Just evenings',
    schedule: '20:00',
    value: 'JUST_EVENINGS',
  },
  {
    detail: 'Begin the day with one morning reflection.',
    label: 'Just mornings',
    schedule: '08:00',
    value: 'JUST_MORNINGS',
  },
  {
    detail: 'Choose two windows at least eight hours apart.',
    label: 'Custom times',
    schedule: 'Choose 2 times',
    value: 'CUSTOM',
  },
]

const intentOptions: IntentOption[] = [
  {
    detail: 'Notice what you are feeling beneath the day.',
    label: 'Understand my emotions',
    value: 'UNDERSTAND_EMOTIONS',
  },
  {
    detail: 'Connect recurring moments and changes across your days.',
    label: 'Spot patterns in my days',
    value: 'SPOT_PATTERNS',
  },
  {
    detail: 'Turn one useful realization into a manageable next step.',
    label: 'Make small changes',
    value: 'BUILD_SMALL_CHANGES',
  },
  {
    detail: 'Give your Rewind partner a focus that is personal to you.',
    label: 'Set my own focus',
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

function isProFrequency(value: RewindRoutineFrequency): boolean {
  return value === 'MORNINGS_AND_EVENINGS' || value === 'CUSTOM'
}

function ChoiceIndicator({
  requiresPro,
  selected,
}: {
  requiresPro: boolean
  selected: boolean
}): ReactElement | null {
  if (requiresPro) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-accent-900 px-2 py-1">
        <RiVipCrownLine size={11} className="text-accent-100" />
        <Text className="font-bbh text-[9px] font-bold text-accent-100">
          PRO
        </Text>
      </View>
    )
  }

  if (!selected) return null

  return (
    <View className="size-6 items-center justify-center rounded-full bg-accent-500">
      <RiCheckLine size={15} className="text-white" />
    </View>
  )
}

function SelectionExplanation({
  detail,
  label,
}: {
  detail: string
  label: string
}): ReactElement {
  return (
    <View
      className="flex-row items-start gap-3 rounded-2xl px-4 py-4"
      style={{ backgroundColor: colors.cardx }}
    >
      <View className="mt-1 size-2 shrink-0 rounded-full bg-success-green" />
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-bbh text-sm font-semibold text-white">
          {label}
        </Text>
        <Text className="muted font-bbh text-xs leading-5">{detail}</Text>
      </View>
    </View>
  )
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
  const { handleSubscriptionError, requestProAccess } = useProAccess()
  const { isPro, isSupported: isSubscriptionSupported } = useSubscription()
  const [frequency, setFrequency] = useState<RewindRoutineFrequency>(
    isSubscriptionSupported ? 'MORNINGS_AND_EVENINGS' : 'JUST_EVENINGS',
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

    setFrequency(
      !isSubscriptionSupported && isProFrequency(routine.frequency)
        ? 'JUST_EVENINGS'
        : routine.frequency,
    )
    setIntent(routine.intent)
    setCustomIntent(routine.customIntent ?? '')
    if (routine.times.length === 2) {
      setTimes([routine.times[0], routine.times[1]])
    }
  }, [isSubscriptionSupported, routineQuery.data?.routine])

  const timezone = getDeviceTimezone()
  const timeError = useMemo(
    () => (frequency === 'CUSTOM' ? getCustomRewindTimeError(times) : null),
    [frequency, times],
  )
  const intentError =
    intent === 'CUSTOM' && !customIntent.trim()
      ? 'Add a short focus for your Rewinds.'
      : null
  const canSave = !timeError && !intentError && !updateRoutine.isPending
  const selectedFrequency =
    frequencyOptions.find((option) => option.value === frequency) ??
    frequencyOptions[0]
  const selectedIntent =
    intentOptions.find((option) => option.value === intent) ?? intentOptions[0]
  const visibleFrequencyOptions = isSubscriptionSupported
    ? frequencyOptions
    : frequencyOptions.filter((option) => !isProFrequency(option.value))

  const returnToOrigin = useCallback((): void => {
    if (origin === 'settings') {
      void navigate({ replace: true, to: '/app/sub-profile/settings' })
      return
    }

    void navigate({ replace: true, to: '/app/rewind' })
  }, [navigate, origin])

  const handleSave = async (): Promise<void> => {
    if (!canSave) return

    if (isProFrequency(frequency) && !isPro) {
      const granted = await requestProAccess()
      if (!granted) return
    }

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
      const handled = await handleSubscriptionError(error)
      if (handled) return
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <View className="relative flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader canGoBack onBack={returnToOrigin} title="Rewind routine" />

        <View className="flex-1 overflow-y-auto px-mg pb-[132px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-7">
            <View className="flex-row items-center gap-1.5 px-1">
              <RiTimeLine size={13} className="shrink-0 text-warning-yellow" />
              <Text className="muted min-w-0 font-bbh text-xs">
                Local time: {timezone}
              </Text>
            </View>

            <View className="gap-3">
              <View className="gap-1 px-1">
                <Text className="font-bbh text-base font-bold text-white">
                  Choose a schedule
                </Text>
                <Text className="muted font-bbh text-xs">
                  Each Rewind stays open for one hour.
                </Text>
              </View>

              <View className="grid grid-cols-2 gap-3">
                {visibleFrequencyOptions.map((option) => {
                  const selected = frequency === option.value
                  const requiresPro = isProFrequency(option.value) && !isPro
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={`${option.label}, ${option.schedule}`}
                      className={cn(
                        'min-h-[104px] !flex !flex-row w-full justify-between rounded-2xl border px-4 py-4 text-left',
                        selected ? 'border-accent-500' : 'border-transparent',
                      )}
                      style={{ backgroundColor: colors.cardx }}
                      onPress={() => {
                        if (!requiresPro) {
                          setFrequency(option.value)
                          return
                        }

                        void requestProAccess().then((granted) => {
                          if (granted) setFrequency(option.value)
                        })
                      }}
                    >
                      <View className="flex-col items-start justify-between gap-2">
                        <Text
                          className="min-w-0 flex-1 font-bbh text-xs font-semibold leading-5 text-white"
                          lines={2}
                        >
                          {option.label}
                        </Text>
                        <Text className="muted font-bbh text-[11px] tabular-nums">
                          {option.schedule}
                        </Text>
                      </View>
                      <View>
                        <ChoiceIndicator
                          requiresPro={requiresPro}
                          selected={selected}
                        />
                      </View>
                    </Pressable>
                  )
                })}
              </View>

              <SelectionExplanation
                detail={selectedFrequency.detail}
                label={selectedFrequency.label}
              />
            </View>

            {frequency === 'CUSTOM' ? (
              <View className="gap-3">
                <Text className="px-1 font-bbh text-sm font-semibold text-white">
                  Your two times
                </Text>
                <View
                  className="overflow-hidden rounded-2xl"
                  style={{ backgroundColor: colors.cardx }}
                >
                  {times.map((time, index) => (
                    <View
                      key={index}
                      className={cn(
                        'min-h-16 flex-row items-center justify-between gap-4 px-4 py-3',
                        index === 0 ? 'border-b border-card-light' : '',
                      )}
                    >
                      <Text className="font-bbh text-sm font-semibold text-white">
                        {index === 0 ? 'First Rewind' : 'Second Rewind'}
                      </Text>
                      <View className="min-w-[124px] flex-row items-center gap-2 rounded-xl bg-cardd px-3 py-2">
                        <RiTimeLine size={16} className="text-card-lighter-3" />
                        <input
                          aria-label={
                            index === 0
                              ? 'First Rewind time'
                              : 'Second Rewind time'
                          }
                          className="min-w-0 w-full bg-transparent font-bbh text-base text-white outline-none"
                          onChange={(event) => {
                            setTimes(
                              index === 0
                                ? [event.target.value, times[1]]
                                : [times[0], event.target.value],
                            )
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
                    'px-1 font-bbh text-xs',
                    timeError ? 'text-danger-400' : 'muted',
                  )}
                >
                  {timeError ?? 'Keep at least eight hours between both times.'}
                </Text>
              </View>
            ) : null}

            <View className="gap-3">
              <View className="gap-1 px-1">
                <Text className="font-bbh text-base font-bold text-white">
                  Choose your focus
                </Text>
                <Text className="muted font-bbh text-xs">
                  Your partner uses this to guide the conversation.
                </Text>
              </View>

              <View className="grid grid-cols-2 gap-3">
                {intentOptions.map((option) => {
                  const selected = intent === option.value
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={option.label}
                      className={cn(
                        'min-h-[88px] w-full justify-between rounded-2xl border px-4 py-4 text-left',
                        selected
                          ? 'border-success-green'
                          : 'border-transparent',
                      )}
                      style={{ backgroundColor: colors.cardx }}
                      onPress={() => setIntent(option.value)}
                    >
                      <Text
                        className="font-bbh text-sm font-semibold leading-5 text-white"
                        lines={2}
                      >
                        {option.label}
                      </Text>
                      {selected ? (
                        <View>
                          <View className="size-6 items-center justify-center rounded-full bg-success-green">
                            <RiCheckLine size={15} className="text-white" />
                          </View>
                        </View>
                      ) : null}
                    </Pressable>
                  )
                })}
              </View>

              <SelectionExplanation
                detail={selectedIntent.detail}
                label={selectedIntent.label}
              />
            </View>

            {intent === 'CUSTOM' ? (
              <View
                className="rounded-2xl px-2 py-2"
                style={{ backgroundColor: colors.cardx }}
              >
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
          </View>
        </View>

        <View
          className="absolute inset-x-0 bottom-0 bg-cardd px-mg pt-3"
          style={{
            paddingBottom: 'calc(var(--safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          <Pressable
            className="mx-auto min-h-12 w-full max-w-3xl flex-row items-center justify-center gap-2 rounded-full bg-white disabled:opacity-45"
            disabled={!canSave}
            onPress={() => {
              void handleSave()
            }}
          >
            {updateRoutine.isPending ? (
              <RiLoader4Line size={18} className="animate-spin text-cardd" />
            ) : null}
            <Text className="font-bbh font-bold text-cardd">
              {updateRoutine.isPending ? 'Saving...' : 'Save routine'}
            </Text>
          </Pressable>
        </View>
      </NoiseComponent>
    </View>
  )
}

export default RewindRoutineScreen
