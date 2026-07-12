import { RiArrowDownSLine, RiCloseLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
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

import { RewindFilterSheet } from './history/rewind-filter-sheet.component'
import {
  RewindDaySection,
  RewindEmptyState,
  RewindErrorState,
  RewindSkeletonRow,
} from './history/rewind-history-primitives.component'
import {
  ALL_DAYS_FILTER,
  ALL_PARTNERS_FILTER,
} from './history/rewind-history.constants'
import type { DayFilter, PartnerFilter } from './history/rewind-history.types'
import {
  formatDayLabel,
  groupSessionsByDay,
} from './history/rewind-history.utils'
import { RewindSessionRow } from './history/rewind-session-row.component'

export default function RewindHistoryScreen(): ReactElement {
  const [partnerFilter, setPartnerFilter] =
    useState<PartnerFilter>(ALL_PARTNERS_FILTER)
  const [dayFilter, setDayFilter] = useState<DayFilter>(ALL_DAYS_FILTER)
  const bottomSheet = useBottomSheet()
  const navigate = useNavigate()
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
      { title: 'Filter rewinds' },
    )
  }

  function openSession(session: RewindSession): void {
    void navigate({
      params: { sessionId: session.id },
      to: '/app/r/$sessionId',
    })
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader title="Rewind" />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-1">
          <View className="mx-auto w-full max-w-3xl">
            <View className="gap-5">
              <View className="gap-2 px-1 pb-1">
                <Text
                  className="font-bbh text-2xl font-bold"
                  style={{ color: colors.white }}
                >
                  Your reflections
                </Text>
                <Text
                  className="max-w-xl font-bbh text-sm leading-6"
                  style={{ color: colors['card-lighter-2'] }}
                >
                  Every partner remembers your conversations through their own
                  perspective. Open a Rewind to revisit what they heard.
                </Text>
                <Text
                  className="font-bbh text-xs"
                  style={{ color: colors['card-lighter-3'] }}
                >
                  {summary.total} {summary.total === 1 ? 'rewind' : 'rewinds'} ·{' '}
                  {summary.completed} complete · {summary.open} open
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Text
                  className="font-bbh text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: colors['card-lighter-3'] }}
                >
                  Filter by:
                </Text>
                <Pressable
                  onPress={openFilters}
                  accessibilityLabel="Filter Rewind history"
                  className="py-3 min-w-0 flex-1 flex-row items-center justify-between rounded-lg px-4"
                  style={{ backgroundColor: colors['card-light-50'] }}
                >
                  <View className="min-w-0 flex-1 gap-0.5 text-left">
                    <Text
                      className="truncate font-bbh text-sm font-bold"
                      style={{ color: colors.white }}
                    >
                      {partnerFilter === ALL_PARTNERS_FILTER
                        ? 'All partners'
                        : getRewindPersona(partnerFilter).name}
                      {' · '}
                      {dayFilter === ALL_DAYS_FILTER
                        ? 'All days'
                        : formatDayLabel(dayFilter)}
                    </Text>
                  </View>
                  <RiArrowDownSLine
                    size={20}
                    style={{ color: colors['card-lighter-2'] }}
                  />
                </Pressable>

                {hasActiveFilters ? (
                  <Pressable
                    onPress={resetFilters}
                    accessibilityLabel="Clear Rewind filters"
                    className="h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: colors['card-light-50'] }}
                  >
                    <RiCloseLine
                      size={18}
                      style={{ color: colors['card-lighter-2'] }}
                    />
                  </Pressable>
                ) : null}
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
                      <View className="mt-2 px-1 py-2">
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
