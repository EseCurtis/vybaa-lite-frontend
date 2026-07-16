import { RiArrowDownSLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useMemo } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { usePaginatedRewindSessions } from '@/hooks/use-rewind.hook'
import type { RewindSession } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { normalizePages } from '@/shared/utils/helpers.util'

import {
  RewindDaySection,
  RewindEmptyState,
  RewindErrorState,
  RewindSkeletonRow,
} from './history/rewind-history-primitives.component'
import { groupSessionsByDay } from './history/rewind-history.utils'
import { RewindSessionRow } from './history/rewind-session-row.component'

export default function RewindSessionArchiveScreen(): ReactElement {
  const navigate = useNavigate()
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = usePaginatedRewindSessions()
  const sessions = useMemo(
    () => normalizePages<RewindSession>(data?.pages),
    [data?.pages],
  )
  const groupedSessions = useMemo(() => groupSessionsByDay(sessions), [sessions])

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => navigate({ replace: true, to: '/app/rewind-history' })}
          title="Transcript history"
        />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-5">
            <View className="gap-1 px-1">
              <Text className="font-bbh text-xl font-bold text-white">
                Past Rewinds
              </Text>
              <Text className="muted font-bbh text-sm leading-6">
                Your saved conversations, in the order they happened.
              </Text>
            </View>

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
                          void navigate({
                            params: { sessionId: session.id },
                            to: '/app/r/$sessionId',
                          })
                        }}
                        session={session}
                      />
                    ))}
                  </RewindDaySection>
                ))}

                {hasNextPage ? (
                  <View className="px-1 py-2">
                    <Button
                      disabled={isFetchingNextPage}
                      label={isFetchingNextPage ? 'Loading…' : 'Load more'}
                      onClick={() => {
                        void fetchNextPage()
                      }}
                      rightIcon={<RiArrowDownSLine size={20} className="text-white" />}
                      variant="secondary"
                      fullWidth
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <RewindEmptyState isFiltered={false} />
            )}

            {error instanceof Error ? (
              <Text className="muted px-1 font-bbh text-xs">{error.message}</Text>
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
