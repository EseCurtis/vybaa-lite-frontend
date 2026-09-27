import {
  RiArrowRightLine,
  RiBookOpenLine,
  RiInformationLine,
  RiRefreshLine,
  RiVipCrownLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import { useSubscription } from '@/providers/subscription.provider'
import type {
  RewindInsightsRange,
  RewindWellbeingSignals,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { cn } from '@/shared/utils/helpers.util'

import { RewindRadarChart } from './history/rewind-radar-chart.component'

const INSIGHT_RANGES: Array<{ label: string; value: RewindInsightsRange }> = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

const EMPTY_REWIND_SIGNALS: RewindWellbeingSignals = {
  agency: 0,
  clarity: 0,
  connection: 0,
  emotionalSteadiness: 0,
  energy: 0,
}

function ProgressReading({
  color,
  label,
  value,
}: {
  color: string
  label: string
  value: number | null
}): ReactElement {
  const width = value === null ? 0 : Math.max(2, value)

  return (
    <View className="gap-2.5 py-1">
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <View
            className="size-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <Text className="font-bbh text-sm font-semibold text-white">
            {label}
          </Text>
        </View>
        <Text className="muted font-bbh text-xs tabular-nums">
          {value === null ? '--' : `${value}%`}
        </Text>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-cardd">
        <View
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${width}%` }}
        />
      </View>
    </View>
  )
}

export default function RewindInsightsScreen(): ReactElement {
  const [range, setRange] = useState<RewindInsightsRange>('7d')
  const navigate = useNavigate()
  const { requestProAccess } = useProAccess()
  const { isPro, isSupported: isSubscriptionSupported } = useSubscription()
  const { data, error, isError, isLoading, refetch } = useRewindInsights(range)
  const signals = data?.signals ?? EMPTY_REWIND_SIGNALS
  const hasReflectionData = Boolean(data?.signals && data?.progress)
  const visibleInsightRanges = isSubscriptionSupported
    ? INSIGHT_RANGES
    : INSIGHT_RANGES.slice(0, 1)

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader title="Rewind insights" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-7">
            <View className="flex- bg-cardx rounded-xl !p-3 items-center justify-between gap-4 px-1">
              <View className="min-w-0 flex-1 gap-2 p-3">
                <Text className="font-bbh text-2xl font-bold text-white">
                  Your reflection pattern
                </Text>
                <Text className="muted max-w-xl font-bbh text-sm leading-6">
                  A simple read of what you have shared in Rewind.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Open saved Rewind reflections"
                className="min-h-11 shrink-0 rounded-full w-full flex-row items-center gap-2  bg-card-light px-3"
                onPress={() => navigate({ to: '/app/rewind-history-sessions' })}
              >
                <RiBookOpenLine size={17} className="text-white" />
                <Text className="font-bbh mx-auto text-xs font-bold text-white">
                  See Reflections and history
                </Text>
                <RiArrowRightLine size={15} className="text-card-lighter-2 ml-auto" />
              </Pressable>
            </View>

            <View className="sticky top-0 z-20 bg-cardd py-2">
              <View
                className="flex-row rounded-lg p-1"
                style={{ backgroundColor: colors.cardx }}
              >
                {visibleInsightRanges.map((option) => {
                  const isSelected = option.value === range
                  const requiresPro = option.value !== '7d'
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityLabel={`Show ${option.label} of Rewind insights`}
                      aria-pressed={isSelected}
                      className={cn(
                        'min-h-11 flex-1 items-center justify-center rounded-md px-2',
                        isSelected ? 'bg-white' : '',
                      )}
                      onPress={() => {
                        if (!requiresPro || isPro) {
                          setRange(option.value)
                          return
                        }

                        void requestProAccess().then((granted) => {
                          if (granted) setRange(option.value)
                        })
                      }}
                    >
                      <View className="flex-row items-center gap-1">
                        <Text
                          className={cn(
                            'font-bbh text-xs font-bold',
                            isSelected ? 'text-cardd' : 'muted',
                          )}
                        >
                          {option.label}
                        </Text>
                        {requiresPro && !isPro ? (
                          <RiVipCrownLine
                            size={11}
                            className={
                              isSelected ? 'text-cardd' : 'text-accent-300'
                            }
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {isLoading ? (
              <View className="gap-5 py-3">
                <View
                  className="gap-4 rounded-2xl px-4 py-5"
                  style={{ backgroundColor: colors.cardx }}
                >
                  <View className="gap-2">
                    <Skeleton className="h-4 w-40" rounded="sm" />
                    <Skeleton className="h-3 w-56" rounded="sm" />
                  </View>
                  <Skeleton className="aspect-square w-full" rounded="xl" />
                </View>
                <View
                  className="gap-4 rounded-2xl px-4 py-5"
                  style={{ backgroundColor: colors.cardx }}
                >
                  <Skeleton className="h-4 w-36" rounded="sm" />
                  <Skeleton className="h-8 w-full" rounded="md" />
                  <Skeleton className="h-8 w-full" rounded="md" />
                  <Skeleton className="h-8 w-full" rounded="md" />
                </View>
              </View>
            ) : isError ? (
              <View className="gap-4 py-12">
                <Text className="font-bbh text-base font-bold text-white">
                  Insights are unavailable right now
                </Text>
                <Text className="muted font-bbh text-sm leading-6">
                  {error instanceof Error ? error.message : 'Please try again.'}
                </Text>
                <Pressable
                  accessibilityLabel="Retry loading Rewind insights"
                  className="min-h-11 flex-row items-center gap-2 self-start rounded-lg bg-white px-4"
                  onPress={() => {
                    void refetch()
                  }}
                >
                  <RiRefreshLine size={17} className="text-cardd" />
                  <Text className="font-bbh text-sm font-bold text-cardd">
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : data ? (
              <>
                <View className="gap-5">
                  <View
                    className="gap-3 rounded-2xl px-4 py-5"
                    style={{ backgroundColor: colors.cardx }}
                  >
                    <View className="flex-row items-start justify-between gap-4">
                      <View className="min-w-0 flex-1 gap-1">
                        <Text className="font-bbh text-base font-bold text-white">
                          Reflection map
                        </Text>
                        <Text className="muted font-bbh text-xs leading-5">
                          {data.coverage.completedSessions
                            ? `${data.coverage.completedSessions} completed ${
                                data.coverage.completedSessions === 1
                                  ? 'Rewind'
                                  : 'Rewinds'
                              }`
                            : 'Your first Rewind will shape this map'}
                        </Text>
                      </View>
                      <Text className="muted shrink-0 font-bbh text-xs tabular-nums">
                        {data.coverage.completedDays}/{data.coverage.days} days
                      </Text>
                    </View>

                    <RewindRadarChart
                      empty={!hasReflectionData}
                      signals={signals}
                    />

                    {data.coverage.completedSessions > 0 &&
                    data.coverage.completedSessions < 3 ? (
                      <Text className="muted text-center font-bbh text-[11px] leading-5">
                        Early read. It will become more representative as you
                        Rewind.
                      </Text>
                    ) : null}
                  </View>

                  <View
                    className="gap-4 rounded-2xl px-4 py-5"
                    style={{ backgroundColor: colors.cardx }}
                  >
                    <Text className="font-bbh text-base font-bold text-white">
                      Progress readings
                    </Text>
                    <ProgressReading
                      color={colors['warning-yellow']}
                      label="Consistency"
                      value={data.progress?.consistency ?? null}
                    />
                    <ProgressReading
                      color={colors['success-green']}
                      label="Clarity"
                      value={data.progress?.clarity ?? null}
                    />
                    <ProgressReading
                      color={colors.accent[700]}
                      label="Momentum"
                      value={data.progress?.momentum ?? null}
                    />
                  </View>

                  {data.contextualInsight ? (
                    <View
                      className="gap-2 rounded-2xl px-4 py-5"
                      style={{ backgroundColor: colors.cardx }}
                    >
                      <View className="flex-row items-center gap-2">
                        <View className="h-1.5 w-5 rounded-full bg-accent-700" />
                        <Text className="font-bbh text-xs font-bold text-white">
                          Worth noticing
                        </Text>
                      </View>
                      <Text className="muted font-bbh text-sm leading-6">
                        {data.contextualInsight}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View
                  className="flex-row items-start gap-3 rounded-2xl px-4 py-5"
                  style={{ backgroundColor: colors.cardx }}
                >
                  <RiInformationLine
                    size={18}
                    className="mt-0.5 shrink-0"
                    style={{ color: colors['warning-yellow'] }}
                  />
                  <Text className="muted flex-1 font-bbh text-xs leading-5">
                    These readings reflect what you shared in Rewind. They are
                    not medical measures or diagnoses.
                  </Text>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
