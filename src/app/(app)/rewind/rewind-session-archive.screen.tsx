import { useNavigate, useRouter } from '@tanstack/react-router'
import type { ReactElement } from 'react'
import { useMemo } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useReflectionDays } from '@/hooks/use-reflection-days.hook'
import { useAuth } from '@/providers/auth.provider'
import { colors } from '@/shared/colors.shared'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'

import {
  RewindDaySection,
  RewindEmptyState,
  RewindErrorState,
  RewindSkeletonRow,
} from './history/rewind-history-primitives.component'
import { formatDayLabel } from './history/rewind-history.utils'
import { DailyReflectionRow } from './history/daily-reflection-row.component'
import { RewindSessionRow } from './history/rewind-session-row.component'

export default function RewindSessionArchiveScreen(): ReactElement {
  const navigate = useNavigate()
  const router = useRouter()
  const { user } = useAuth()
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useReflectionDays()
  const days = useMemo(() => {
    const loaded = data?.pages.flatMap((page) => page.days) ?? []
    return loaded.filter(
      (day, index) =>
        loaded.findIndex((other) => other.dayKey === day.dayKey) === index,
    )
  }, [data?.pages])

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => {
            void navigateBackWithinApp(
              router,
              '/app/rewind-history-sessions',
              '/app/rewind-history',
            )
          }}
          title="Reflections"
        />

        <View className="flex-1 overflow-y-auto px-mg pb-[120px] pt-2">
          <View className="mx-auto w-full max-w-3xl gap-5">
            {isLoading ? (
              <View className="gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <RewindSkeletonRow key={index} />
                ))}
              </View>
            ) : isError && !data ? (
              <RewindErrorState
                onRetry={() => {
                  void refetch()
                }}
              />
            ) : days.length ? (
              <View className="gap-3">
                {data?.pages[0]?.upcomingSessions.length ? (
                  <RewindDaySection
                    label="Scheduled"
                    total={data.pages[0].upcomingSessions.length}
                  >
                    {data.pages[0].upcomingSessions.map((session, index) => (
                      <RewindSessionRow
                        key={session.id}
                        index={index}
                        session={session}
                        user={user ?? undefined}
                      />
                    ))}
                  </RewindDaySection>
                ) : null}
                {days.map((group) => (
                  <RewindDaySection
                    key={group.dayKey}
                    hasDailyReflection
                    label={formatDayLabel(group.dayKey, data?.pages[0]?.today)}
                    total={group.sessions.length}
                  >
                    <DailyReflectionRow
                      reflection={group.reflection}
                      user={user ?? undefined}
                    />
                    <>
                      {group.sessions.map((session, index) => (
                        <RewindSessionRow
                          key={session.id}
                          index={index}
                          onPress={() => {
                            void navigate({
                              params: { sessionId: session.id },
                              search: { from: 'history' },
                              to: '/app/r/$sessionId',
                            })
                          }}
                          session={session}
                          user={user ?? undefined}
                        />
                      ))}
                    </>
                  </RewindDaySection>
                ))}

                {isError ? (
                  <Button
                    label="Retry loading reflections"
                    variant="secondary"
                    onClick={() => {
                      void refetch()
                    }}
                  />
                ) : null}

                {hasNextPage ? (
                  <View className="flex-row justify-center px-1 py-2">
                    <Button
                      disabled={isFetchingNextPage}
                      label={isFetchingNextPage ? 'Loading…' : 'Load more'}
                      onClick={() => {
                        void fetchNextPage()
                      }}
                      variant="secondary"
                      className="!h-auto !py-3"
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              <RewindEmptyState isFiltered={false} />
            )}

            {error instanceof Error ? (
              <Text className="muted px-1 font-bbh text-xs">
                {error.message}
              </Text>
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
