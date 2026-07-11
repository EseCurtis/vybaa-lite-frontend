import { RiArrowDownSLine, RiCloseLine } from '@remixicon/react'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { usePaginatedRewindSessions } from '@/hooks/use-rewind.hook'
import type {
  RewindSession,
  RewindSessionsFacets,
  RewindSessionsSummary,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'
import { normalizePages } from '@/shared/utils/helpers.util'

import {
  ALL_DAYS_FILTER,
  ALL_PARTNERS_FILTER,
} from './history/rewind-history.constants'
import { RewindFilterSheet } from './history/rewind-filter-sheet.component'
import {
  RewindDaySection,
  RewindEmptyState,
  RewindErrorState,
  RewindSkeletonRow,
  RewindSummaryMetric,
} from './history/rewind-history-primitives.component'
import type { DayFilter, PartnerFilter } from './history/rewind-history.types'
import { RewindSessionDetailSheet } from './history/rewind-session-detail-sheet.component'
import { RewindSessionRow } from './history/rewind-session-row.component'
import {
  formatDayLabel,
  groupSessionsByDay,
} from './history/rewind-history.utils'

export default function RewindHistoryScreen(): ReactElement {
  const [partnerFilter, setPartnerFilter] =
    useState<PartnerFilter>(ALL_PARTNERS_FILTER)
  const [dayFilter, setDayFilter] = useState<DayFilter>(ALL_DAYS_FILTER)
  const bottomSheet = useBottomSheet()
  const queryFilters = useMemo(() => {
    return {
      day: dayFilter !== ALL_DAYS_FILTER ? dayFilter : undefined,
      personaId:
        partnerFilter !== ALL_PARTNERS_FILTER ? partnerFilter : undefined,
    }
  }, [dayFilter, partnerFilter])
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = usePaginatedRewindSessions(1, 10, queryFilters)

  const sessions = useMemo(
    () => normalizePages<RewindSession>(data?.pages),
    [data?.pages],
  )
  const firstPage = data?.pages[0]
  const facets: RewindSessionsFacets = firstPage?.filters ?? {
    days: [],
    partners: [],
  }
  const summary: RewindSessionsSummary = firstPage?.summary ?? {
    completed: 0,
    open: 0,
    total: 0,
  }
  const dayOptions = facets.days.map((entry) => entry.key)
  const groupedSessions = useMemo(() => {
    return groupSessionsByDay(sessions)
  }, [sessions])
  const partnerCounts = useMemo(() => {
    const counts = new Map<RewindPersonaId, number>()

    for (const entry of facets.partners) {
      counts.set(entry.id, entry.count)
    }

    return counts
  }, [facets.partners])
  const dayCounts = useMemo(() => {
    const counts = new Map<string, number>()

    for (const entry of facets.days) {
      counts.set(entry.key, entry.count)
    }

    return counts
  }, [facets.days])
  const hasActiveFilters =
    partnerFilter !== ALL_PARTNERS_FILTER || dayFilter !== ALL_DAYS_FILTER
  const allPartnerCount = useMemo(() => {
    let count = 0

    for (const entry of facets.partners) {
      count += entry.count
    }

    return count
  }, [facets.partners])
  const allDayCount = useMemo(() => {
    let count = 0

    for (const entry of facets.days) {
      count += entry.count
    }

    return count
  }, [facets.days])

  function resetFilters(): void {
    setPartnerFilter(ALL_PARTNERS_FILTER)
    setDayFilter(ALL_DAYS_FILTER)
  }

  function openFilters(): void {
    bottomSheet.present(
      <RewindFilterSheet
        activeDay={dayFilter}
        activePartner={partnerFilter}
        allDayCount={allDayCount}
        allPartnerCount={allPartnerCount}
        dayCounts={dayCounts}
        dayOptions={dayOptions}
        onApply={({ day, partner }) => {
          setDayFilter(day)
          setPartnerFilter(partner)
        }}
        onDismiss={bottomSheet.dismiss}
        partnerCounts={partnerCounts}
      />,
      { title: 'Filters' },
    )
  }

  function openSession(session: RewindSession): void {
    const persona = getRewindPersona(session.personaId)
    bottomSheet.present(<RewindSessionDetailSheet session={session} />, {
      title: persona.name,
    })
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader title="Rewind History" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-1">
          <View className="mx-auto w-full max-w-3xl">
            <View className="gap-4">
              <View
                className="gap-3 rounded-[28px] px-1 py-1"
                style={{ backgroundColor: 'transparent' }}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="min-w-0 flex-1 gap-1">
                    <Text
                      className="font-bbh text-lg font-bold"
                      style={{ color: colors.white }}
                    >
                      Rewind archive
                    </Text>
                    <Text
                      className="font-bbh text-sm"
                      style={{ color: colors['card-lighter-2'] }}
                    >
                      {summary.total} sessions across {facets.days.length} days
                    </Text>
                  </View>

                  {hasActiveFilters ? (
                    <Pressable
                      onPress={resetFilters}
                      className="min-h-[40px] flex-row items-center gap-1.5 rounded-full px-3 py-2"
                      style={{ backgroundColor: colors['card-light-50'] }}
                    >
                      <RiCloseLine
                        size={14}
                        style={{ color: colors['card-lighter-2'] }}
                      />
                      <Text
                        className="font-bbh text-xs font-bold uppercase tracking-[0.12em]"
                        style={{ color: colors['card-lighter-2'] }}
                      >
                        Reset
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View
                  className="flex-row gap-2 rounded-[24px] px-2 py-2"
                  style={{ backgroundColor: colors['card-light-50'] }}
                >
                  <RewindSummaryMetric label="Matching" value={summary.total} />
                  <RewindSummaryMetric
                    label="Completed"
                    value={summary.completed}
                  />
                  <RewindSummaryMetric label="Open" value={summary.open} />
                </View>
              </View>

              <View className="gap-3 py-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Pressable
                    onPress={openFilters}
                    className="min-h-[40px] flex-row items-center gap-2 rounded-full px-3.5 py-2"
                    style={{ backgroundColor: colors['card-light-50'] }}
                  >
                    <Text
                      className="font-bbh text-xs font-bold uppercase tracking-[0.12em]"
                      style={{ color: colors.white }}
                    >
                      Filters
                    </Text>
                    <RiArrowDownSLine
                      size={16}
                      style={{ color: colors['card-lighter-2'] }}
                    />
                  </Pressable>

                  {partnerFilter !== ALL_PARTNERS_FILTER ? (
                    <View
                      className="rounded-full px-3 py-2"
                      style={{ backgroundColor: colors['card-light-50'] }}
                    >
                      <Text
                        className="font-bbh text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: colors['card-lighter-2'] }}
                      >
                        {getRewindPersona(partnerFilter).name}
                      </Text>
                    </View>
                  ) : null}

                  {dayFilter !== ALL_DAYS_FILTER ? (
                    <View
                      className="rounded-full px-3 py-2"
                      style={{ backgroundColor: colors['card-light-50'] }}
                    >
                      <Text
                        className="font-bbh text-[11px] font-bold uppercase tracking-[0.12em]"
                        style={{ color: colors['card-lighter-2'] }}
                      >
                        {formatDayLabel(dayFilter)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View className="gap-3 py-2">
                {isLoading ? (
                  <View className="gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <RewindSkeletonRow key={index} />
                    ))}
                  </View>
                ) : isError ? (
                  <RewindErrorState
                    onRetry={() => {
                      void refetch()
                    }}
                  />
                ) : groupedSessions.length ? (
                  <View className="gap-4">
                    {groupedSessions.map((group) => (
                      <RewindDaySection
                        key={group.dayKey}
                        label={group.label}
                        total={group.sessions.length}
                      >
                        {group.sessions.map((session, index) => (
                          <RewindSessionRow
                            key={session.id}
                            index={index}
                            onPress={() => {
                              openSession(session)
                            }}
                            session={session}
                          />
                        ))}
                      </RewindDaySection>
                    ))}

                    {hasNextPage && (
                      <View
                        className="mt-2 rounded-[22px] px-4 py-3"
                        style={{ backgroundColor: colors['card-light-50'] }}
                      >
                        <Button
                          label={
                            isFetchingNextPage ? 'Loading...' : 'Load more'
                          }
                          variant="secondary"
                          fullWidth
                          disabled={isFetchingNextPage}
                          rightIcon={
                            <RiArrowDownSLine
                              size={20}
                              className="text-white"
                            />
                          }
                          onClick={() => {
                            void fetchNextPage()
                          }}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  <RewindEmptyState
                    isFiltered={hasActiveFilters}
                    onReset={hasActiveFilters ? resetFilters : undefined}
                  />
                )}
              </View>

              {error instanceof Error ? (
                <Text
                  className="px-1 font-bbh text-xs"
                  style={{ color: colors['card-lighter-3'] }}
                >
                  {error.message}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
