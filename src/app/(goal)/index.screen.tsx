import { GoalRowSkeleton } from '@/components/common/loading-layouts.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { QueryFeedback } from '@/components/common/query-feedback.component'
import { readGoalCreationDraft } from '@/components/custom/goal/create-goal-sheet.component'
import { TaskListRow } from '@/components/custom/goal/task-list-row.component'
import { TaskQuickAdd } from '@/components/custom/goal/task-quick-add.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useArchiveLegacyGoal,
  useDeleteLegacyGoal,
  useInfiniteGoals,
  useLegacyGoals,
  useReopenLegacyGoal,
} from '@/hooks/use-goals.hook'
import type { Goal, GoalListFilter, LegacyGoal } from '@/shared/api/goal.api'
import {
  getGoalLibraryTab,
  isActiveGoalFilter,
  isEndedGoalFilter,
  type GoalLibraryTab,
} from '@/shared/goal/goal-library-filter.util'
import {
  cn,
  contrastingTextColor,
  seededColor,
} from '@/shared/utils/helpers.util'
import {
  RiAddFill,
  RiArchiveLine,
  RiCalendarCheckLine,
  RiCloseLine,
  RiPauseLine,
  RiQuillPenFill,
  RiSearchLine,
  RiTargetLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

const PAUSED_INFO_DISMISSED_KEY = 'goals:paused-info-dismissed'

function hasDismissedPausedInfo(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(PAUSED_INFO_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

function GoalCard({
  goal,
  onOpen,
}: {
  goal: Goal
  onOpen: (goal: Goal) => void
}) {
  return <TaskListRow goal={goal} onOpen={onOpen} />
}

function LegacyCard({ goal }: { goal: LegacyGoal }) {
  const archive = useArchiveLegacyGoal()
  const reopen = useReopenLegacyGoal()
  const permanentlyDelete = useDeleteLegacyGoal()
  const accent = seededColor(goal.title)
  const accentText = contrastingTextColor(accent)
  const progress = Math.min(
    100,
    Math.max(0, (goal.currentDay / goal.targetDays) * 100),
  )
  return (
    <View className="mb-3 rounded-3xl bg-card-light-50 p-3">
      <View className="flex-row items-center gap-3">
        <View
          className="size-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: accent }}
        >
          <Text className="text-lg font-bold" style={{ color: accentText }}>
            {goal.title.trim().charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 truncate font-bold text-white">
              {goal.title}
            </Text>
            <Text className="rounded-full bg-card-light px-2 py-1 text-[9px] font-bold text-card-lighter-2">
              LEGACY
            </Text>
          </View>
          <Text className="mt-1 text-xs text-card-lighter-2">
            {goal.isCompleted ? 'Completed history' : 'Read-only history'}
          </Text>
        </View>
      </View>
      <View className="mt-3 flex-row items-center gap-3">
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-light">
          <View
            className="h-full rounded-full"
            style={{ backgroundColor: accent, width: `${progress}%` }}
          />
        </View>
        <Text className="text-xs font-bold text-card-lighter-2">
          {goal.currentDay}/{goal.targetDays}
        </Text>
      </View>
      <View className="mt-3 flex-row flex-wrap items-center gap-2">
        <Pressable
          className="rounded-full bg-white px-3 py-2"
          onPress={() => reopen.mutate(goal.id)}
        >
          <Text className="text-xs font-bold text-black">Start as new</Text>
        </Pressable>
        {!goal.archivedAt ? (
          <Pressable
            className="rounded-full bg-card-light px-3 py-2"
            onPress={() => archive.mutate(goal.id)}
          >
            <Text className="text-xs">Archive</Text>
          </Pressable>
        ) : (
          <Pressable
            className="rounded-full px-3 py-2"
            style={{ backgroundColor: '#351b24' }}
            onPress={() => {
              if (
                confirm(
                  'Permanently delete this legacy task? Historical reward transactions will remain.',
                )
              ) {
                permanentlyDelete.mutate(goal.id)
              }
            }}
          >
            <Text className="text-xs text-danger-400">Delete permanently</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

function GoalEmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string
  description: string
  icon: ReactNode
  onAction?: () => void
  title: string
}) {
  return (
    <View className="items-center rounded-lg  px-6 py-12 text-center">
      <View className="mb-4  items-center justify-center rounded-2xl ">
        {icon}
      </View>
      <Text className="text-lg font-bold">{title}</Text>
      <Text className="mt-2 max-w-xs !text-center text-sm leading-5 text-card-lighter-2">
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          className="mt-5 rounded-full bg-white px-5 py-3"
          onPress={onAction}
        >
          <Text className="font-bold text-black">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function emptyStateForFilter(filter: GoalListFilter): {
  description: string
  icon: ReactNode
  title: string
  actionLabel?: string
} {
  if (filter === 'DUE') {
    return {
      description:
        'Nothing needs your attention today. Check back when your next occurrence is due.',
      icon: <RiCalendarCheckLine className="text-card-lighter-2" size={22} />,
      title: 'You’re all caught up',
    }
  }
  if (filter === 'OVERDUE') {
    return {
      description: 'No active task has slipped past its scheduled day.',
      icon: <RiCalendarCheckLine className="text-card-lighter-2" size={22} />,
      title: 'No overdue tasks',
    }
  }
  if (filter === 'PAUSED') {
    return {
      description:
        'Tasks you pause will appear here while their schedule is on hold.',
      icon: <RiPauseLine className="text-card-lighter-2" size={22} />,
      title: 'Nothing paused',
    }
  }
  if (filter === 'ENDED') {
    return {
      description:
        'Completed and abandoned tasks will become part of your history here.',
      icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
      title: 'Your history is clear',
    }
  }
  if (filter === 'ARCHIVED') {
    return {
      description:
        'Archived tasks stay out of your active library but remain available here.',
      icon: <RiArchiveLine className="text-card-lighter-2" size={22} />,
      title: 'No archived tasks',
    }
  }
  return {
    actionLabel: 'Create a task',
    description: 'Choose one small finish line and build from there.',
    icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
    title: 'Start with one task',
  }
}

function GoalFeed({
  filter,
  search,
  onCreate,
  onOpen,
}: {
  filter: GoalListFilter
  search: string
  onCreate: () => void
  onOpen: (goal: Goal) => void
}) {
  const query = useInfiniteGoals({ filter, query: search })
  const goals = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  )
  if (query.isPending && !query.data) {
    return (
      <View className="space-y-2">
        {[0, 1, 2].map((item) => (
          <GoalRowSkeleton key={item} />
        ))}
      </View>
    )
  }
  if (query.isError && !query.data)
    return (
      <QueryFeedback
        message="Your tasks couldn't load."
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    )
  if (!goals.length) {
    if (search)
      return (
        <GoalEmptyState
          description="Try another title or change the selected list."
          icon={<RiSearchLine size={22} />}
          title="No matching tasks"
        />
      )
    const emptyState = emptyStateForFilter(filter)
    return <GoalEmptyState {...emptyState} onAction={onCreate} />
  }
  return (
    <View>
      {query.isError ? (
        <QueryFeedback
          message="Showing your saved tasks. Refresh couldn't complete."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
      {goals.map((goal) => (
        <GoalCard goal={goal} key={goal.id} onOpen={onOpen} />
      ))}
      {query.hasNextPage ? (
        <Pressable
          className="mx-auto rounded-full bg-card-light px-5 py-3"
          disabled={query.isFetchingNextPage}
          onPress={() => query.fetchNextPage()}
        >
          <Text>{query.isFetchingNextPage ? 'Loading…' : 'Load more'}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function GoalsAppScreen({
  filter = 'ACTIVE',
}: {
  filter?: GoalListFilter
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])
  const [savedDraft] = useState(() => readGoalCreationDraft())
  const [activeFilter, setActiveFilter] = useState<
    'ACTIVE' | 'DUE' | 'OVERDUE'
  >(isActiveGoalFilter(filter) ? filter : 'ACTIVE')
  const [endedFilter, setEndedFilter] = useState<'ARCHIVED' | 'ENDED'>(
    isEndedGoalFilter(filter) ? filter : 'ENDED',
  )
  const [showPausedInfo, setShowPausedInfo] = useState(
    () => !hasDismissedPausedInfo(),
  )
  const tab = getGoalLibraryTab(filter)
  const legacy = useLegacyGoals(tab === 'Ended')

  function openGoal(goal: Goal): void {
    navigate({
      params: { goalId: goal.id },
      search: { from: filter },
      to: '/app/goal/$goalId',
    })
  }

  function openCreate(): void {
    navigate({ to: '/app/goal/create' })
  }

  function selectTab(nextTab: GoalLibraryTab): void {
    let nextFilter: GoalListFilter = activeFilter
    if (nextTab === 'Paused') nextFilter = 'PAUSED'
    if (nextTab === 'Ended') nextFilter = endedFilter
    void navigate({ replace: true, search: { filter: nextFilter }, to: '.' })
  }

  return (
    <View className="flex-1 min-h-0 overflow-hidden bg-cardd">
      <TopNotch />
      <NoiseComponent>
        <View className="flex h-full min-h-0 flex-col px-mg">
          <View className="mb-5 mt-2 shrink-0 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold">Tasks</Text>
            </View>
            <Pressable
              accessibilityLabel={
                savedDraft?.title ? 'Continue task draft' : 'Create a new task'
              }
              className="size-11 relative items-center justify-center rounded-full bg-white"
              onPress={openCreate}
              testID="goal-create-button"
            >
              {savedDraft?.title ? (
                <RiQuillPenFill className="text-black" size={22} />
              ) : (
                <RiAddFill className="text-black" size={22} />
              )}

              {savedDraft?.title && (
                <span
                  className="size-3 shrink-0 rounded-full absolute top-0  right-0 bg-yellow-500 border border-cardd"
                  role="status"
                />
              )}
            </Pressable>
          </View>

          <label className="mb-3 flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-card-light-50 px-3">
            <RiSearchLine size={18} className="shrink-0 text-card-lighter-3" />
            <input
              aria-label="Search tasks in this list"
              placeholder="Search tasks"
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-card-lighter-3"
            />
          </label>

          <View className="z-30 -mx-mg shrink-0 flex-row items-center justify-center  py-2">
            <View
              className="justify-center rounded-full bg-cardx flex-row gap-2 p-1"
              data-walkthrough="goal-library-tabs"
            >
              {(['Active', 'Paused', 'Ended'] as GoalLibraryTab[]).map(
                (item) => (
                  <Pressable
                    aria-pressed={tab === item}
                    className={cn(
                      'min-h-11 items-center rounded-full px-3 py-2',
                      tab === item ? 'bg-white' : 'bg-transparent',
                    )}
                    key={item}
                    onPress={() => selectTab(item)}
                  >
                    <Text
                      className={
                        cn(tab === item
                          ? 'font-bold  text-black'
                          : 'text-card-lighter-2', "text-xs")
                      }
                      
                    >
                      {item}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28 no-scrollbar">
            {tab === 'Active' && !search ? (
              <TaskQuickAdd
                onCreated={(goalId) => {
                  void navigate({
                    to: '/app/goal/$goalId',
                    params: { goalId },
                    search: { from: filter },
                  })
                }}
              />
            ) : null}
            {tab === 'Active' ? (
              <View className="mb-4 flex-row flex-wrap gap-2 pt-2">
                {(
                  [
                    {
                      icon: RiCalendarCheckLine,
                      label: 'All',
                      value: 'ACTIVE',
                    },
                    { icon: RiCalendarCheckLine, label: 'Due', value: 'DUE' },
                    { icon: RiArchiveLine, label: 'Overdue', value: 'OVERDUE' },
                  ] as const
                ).map((item) => (
                  <Pressable
                    aria-pressed={filter === item.value}
                    className={cn(
                      'py-3 flex-row items-center gap-1.5 rounded-full  px-4',
                      filter === item.value
                        ? 'bg-white text-black'
                        : 'bg-card-light text-card-lighter-2',
                    )}
                    key={item.value}
                    onPress={() => {
                      setActiveFilter(item.value)
                      void navigate({
                        replace: true,
                        search: { filter: item.value },
                        to: '.',
                      })
                    }}
                  >
                    <item.icon size={13} aria-hidden="true" />
                    <Text className="text-xs text-current">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {tab === 'Ended' ? (
              <View className="mb-4 flex-row gap-2 pt-2">
                {(['ENDED', 'ARCHIVED'] as const).map((item) => (
                  <Pressable
                    aria-pressed={filter === item}
                    className={cn(
                      'min-h-11 flex-row items-center gap-1.5 rounded-full px-3',
                      filter === item
                        ? 'bg-white text-black'
                        : 'bg-card-light text-card-lighter-2',
                    )}
                    key={item}
                    onPress={() => {
                      setEndedFilter(item)
                      void navigate({
                        replace: true,
                        search: { filter: item },
                        to: '.',
                      })
                    }}
                  >
                    {item === 'ENDED' ? (
                      <RiCalendarCheckLine aria-hidden="true" size={13} />
                    ) : (
                      <RiArchiveLine aria-hidden="true" size={13} />
                    )}
                    <Text className="text-xs text-current">
                      {item === 'ENDED' ? 'History' : 'Archived'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <GoalFeed
              key={filter}
              filter={filter}
              search={searchQuery}
              onCreate={openCreate}
              onOpen={openGoal}
            />

            {tab === 'Ended' && legacy.data?.length ? (
              <View className="mt-8">
                <Text className="mb-1 font-bold">Legacy</Text>
                <Text className="mb-4 text-xs text-card-lighter-2">
                  Tasks from the old streak system are preserved as read-only
                  history.
                </Text>
                {legacy.data.map((goal) => (
                  <LegacyCard goal={goal} key={goal.id} />
                ))}
              </View>
            ) : null}

            {tab === 'Ended' && !legacy.isLoading && !legacy.data?.length ? (
              <View className="mt-8">
                <Text className="mb-3 font-bold">Legacy</Text>
                <GoalEmptyState
                  description="Older streak-based tasks will appear here as read-only history."
                  icon={
                    <RiArchiveLine className="text-card-lighter-2" size={20} />
                  }
                  title="No legacy tasks"
                />
              </View>
            ) : null}

            {tab === 'Paused' && showPausedInfo ? (
              <View
                className="fixed bottom-32 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[368px] -translate-x-1/2 flex-row items-start gap-3 rounded-2xl p-4"
                style={{ backgroundColor: '#4a2f12' }}
              >
                <RiPauseLine
                  className="mt-0.5 shrink-0 text-warning-yellow"
                  size={17}
                />
                <Text className="flex-1 text-xs leading-4 text-warning-yellow">
                  Paused tasks take a break: no reminders, new occurrences, or
                  missed days are recorded.
                </Text>
                <Pressable
                  accessibilityLabel="Dismiss paused tasks information"
                  className="size-6 items-center justify-center rounded-full"
                  onPress={() => {
                    try {
                      window.localStorage.setItem(
                        PAUSED_INFO_DISMISSED_KEY,
                        'true',
                      )
                    } catch {
                      // Keep the dismissal effective for this session.
                    }
                    setShowPausedInfo(false)
                  }}
                >
                  <RiCloseLine className="text-warning-yellow" size={16} />
                </Pressable>
              </View>
            ) : null}
          </div>
        </View>
      </NoiseComponent>
    </View>
  )
}
