import {
  RiArrowRightLine,
  RiFileList3Line,
  RiInformationLine,
  RiRefreshLine,
  RiVipCrownLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewindInsights } from '@/hooks/use-rewind.hook'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useSubscription } from '@/providers/subscription.provider'
import type { RewindInsightsRange } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { cn } from '@/shared/utils/helpers.util'

import { RewindRadarChart } from './history/rewind-radar-chart.component'

const INSIGHT_RANGES: Array<{ label: string; value: RewindInsightsRange }> = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
]

function ProgressReading({
  label,
  value,
}: {
  label: string
  value: number
}): ReactElement {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="font-bbh text-sm font-semibold text-white">
          {label}
        </Text>
        <Text className="muted font-bbh text-xs tabular-nums">{value}%</Text>
      </View>
      <View
        className="h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: colors['card-light-50'] }}
      >
        <View
          className="h-full rounded-full bg-white"
          style={{ width: `${Math.max(2, value)}%` }}
        />
      </View>
    </View>
  )
}

export default function RewindInsightsScreen(): ReactElement {
  const [range, setRange] = useState<RewindInsightsRange>('7d')
  const navigate = useNavigate()
  const { requestProAccess } = useProAccess()
  const { isPro } = useSubscription()
  const { data, error, isError, isLoading, refetch } = useRewindInsights(range)

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader title="Rewind insights" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-7">
            <View className="gap-2 px-1">
              <Text className="font-bbh text-2xl font-bold text-white">
                Your reflection pattern
              </Text>
              <Text className="muted max-w-xl font-bbh text-sm leading-6">
                A read of the themes you have chosen to share in completed
                Rewinds.
              </Text>
            </View>

            <View
              className="flex-row rounded-lg p-1"
              style={{ backgroundColor: colors['card-light-50'] }}
            >
              {INSIGHT_RANGES.map((option) => {
                const isSelected = option.value === range
                const requiresPro = option.value !== '7d'
                return (
                  <Pressable
                    key={option.value}
                    accessibilityLabel={`Show ${option.label} of Rewind insights`}
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

            {isLoading ? (
              <View className="items-center gap-3 py-16">
                <Spinner />
                <Text className="muted font-bbh text-sm">
                  Reading your reflections…
                </Text>
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
                {data.hasSufficientData && data.signals && data.progress ? (
                  <View className="gap-7">
                    <View className="gap-2">
                      <View className="flex-row items-end justify-between gap-3 px-1">
                        <View className="gap-1">
                          <Text className="font-bbh text-base font-bold text-white">
                            Reflection map
                          </Text>
                          <Text className="muted font-bbh text-xs">
                            {data.coverage.completedSessions} completed Rewinds
                            in this range
                          </Text>
                        </View>
                        <Text className="muted font-bbh text-xs">
                          {data.coverage.completedDays}/{data.coverage.days}{' '}
                          days
                        </Text>
                      </View>
                      <RewindRadarChart signals={data.signals} />
                    </View>

                    <View className="gap-5">
                      <Text className="font-bbh text-base font-bold text-white">
                        Progress readings
                      </Text>
                      <ProgressReading
                        label="Reflection consistency"
                        value={data.progress.consistency}
                      />
                      <ProgressReading
                        label="Clarity"
                        value={data.progress.clarity}
                      />
                      <ProgressReading
                        label="Momentum"
                        value={data.progress.momentum}
                      />
                    </View>

                    {data.contextualInsight ? (
                      <View
                        className="gap-2 rounded-lg px-4 py-4"
                        style={{ backgroundColor: colors['card-light-50'] }}
                      >
                        <Text className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                          A pattern worth noticing
                        </Text>
                        <Text className="muted font-bbh text-sm leading-6">
                          {data.contextualInsight}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View className="gap-3 py-10">
                    <Text className="font-bbh text-xl font-bold text-white">
                      Your picture is still forming
                    </Text>
                    <Text className="muted max-w-md font-bbh text-sm leading-6">
                      Complete{' '}
                      {Math.max(0, 3 - data.coverage.completedSessions)} more
                      Rewind{data.coverage.completedSessions === 2 ? '' : 's'}{' '}
                      in this range to see a pattern that is grounded in your
                      own reflections.
                    </Text>
                    <Text className="muted font-bbh text-xs">
                      {data.coverage.completedSessions} completed in the last{' '}
                      {data.coverage.days} days
                    </Text>
                  </View>
                )}

                <View
                  className="flex-row items-start gap-3 rounded-lg px-4 py-4"
                  style={{ backgroundColor: colors['card-light-50'] }}
                >
                  <RiInformationLine
                    size={18}
                    className="mt-0.5 shrink-0"
                    style={{ color: colors['card-lighter-3'] }}
                  />
                  <Text className="muted flex-1 font-bbh text-xs leading-5">
                    These readings reflect what you shared in Rewind. They are
                    not medical measures or diagnoses.
                  </Text>
                </View>
              </>
            ) : null}

            <Pressable
              accessibilityLabel="Open Rewind transcript history"
              className="min-h-12 flex-row items-center justify-between rounded-lg px-4"
              style={{ backgroundColor: colors['card-light-50'] }}
              onPress={() => navigate({ to: '/app/rewind-history-sessions' })}
            >
              <View className="flex-row items-center gap-3">
                <RiFileList3Line size={19} style={{ color: colors.white }} />
                <View className="gap-0.5">
                  <Text className="font-bbh text-sm font-bold text-white">
                    Transcript history
                  </Text>
                  <Text className="muted font-bbh text-xs">
                    Open past Rewinds and their saved reflections
                  </Text>
                </View>
              </View>
              <RiArrowRightLine
                size={18}
                style={{ color: colors['card-lighter-2'] }}
              />
            </Pressable>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
