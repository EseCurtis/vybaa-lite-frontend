import { GoalRowSkeleton } from '@/components/common/loading-layouts.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { QueryFeedback } from '@/components/common/query-feedback.component'
import { readGoalCreationDraft } from '@/components/custom/goal/create-goal-sheet.component'
import { TaskListRow } from '@/components/custom/goal/task-list-row.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import type { Goal, GoalListFilter } from '@/shared/api/goal.api'
import {
  getGoalLibraryTab,
  type GoalLibraryTab,
} from '@/shared/goal/goal-library-filter.util'
import { cn } from '@/shared/utils/helpers.util'
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
const TASK_LIBRARY_TABS: Array<{
  filter: GoalListFilter
  tab: GoalLibraryTab
}> = [
  { filter: 'ACTIVE', tab: 'Active' },
  { filter: 'PAUSED', tab: 'Paused' },
  { filter: 'ENDED', tab: 'History' },
  { filter: 'ARCHIVED', tab: 'Archived' },
]

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

function GoalEmptyState({
  actionLabel,
  description,
  icon,
  onAction,
  title,
}: {
  actionLabel?: string
  description?: string
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
      {description ? (
        <Text className="mt-2 max-w-xs !text-center text-sm leading-5 text-card-lighter-2">
          {description}
        </Text>
      ) : null}
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
      icon: <RiCalendarCheckLine className="text-card-lighter-2" size={22} />,
      title: 'All caught up',
    }
  }
  if (filter === 'OVERDUE') {
    return {
      icon: <RiCalendarCheckLine className="text-card-lighter-2" size={22} />,
      title: 'No overdue tasks',
    }
  }
  if (filter === 'PAUSED') {
    return {
      icon: <RiPauseLine className="text-card-lighter-2" size={22} />,
      title: 'No paused tasks',
    }
  }
  if (filter === 'ENDED') {
    return {
      icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
      title: 'No task history yet',
    }
  }
  if (filter === 'ARCHIVED') {
    return {
      icon: <RiArchiveLine className="text-card-lighter-2" size={22} />,
      title: 'Nothing archived',
    }
  }
  return {
    actionLabel: 'Create a task',
    icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
    title: 'No active tasks',
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
          description="Try another search."
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
  const [showPausedInfo, setShowPausedInfo] = useState(
    () => !hasDismissedPausedInfo(),
  )
  const tab = getGoalLibraryTab(filter)

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

  function selectFilter(nextFilter: GoalListFilter): void {
    void navigate({ replace: true, search: { filter: nextFilter }, to: '.' })
  }

  return (
    <View className="flex-1 min-h-0 overflow-hidden bg-cardd">
      <NoiseComponent>
        <>
          <View className="flex h-full min-h-0 flex-col px-mg">
            <TabHeader
              title="Tasks"
              canGoBack
              className="mb-5 mt-2 shrink-0 !px-0 !py-0 [&_[data-testid=tab-header-back]]:size-11"
            >
              <Pressable
                accessibilityLabel={
                  savedDraft?.title
                    ? 'Continue task draft'
                    : 'Create a new task'
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
            </TabHeader>

            <label className="mb-3 flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-card-light-50 px-3">
              <RiSearchLine
                size={18}
                className="shrink-0 text-card-lighter-3"
              />
              <input
                aria-label="Search tasks in this list"
                placeholder="Search tasks"
                maxLength={200}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-h-12 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-card-lighter-3"
              />
            </label>

            <div className="z-30 -mx-mg mb-2 shrink-0 px-mg py-1">
              <div
                aria-label="Task lists"
                className="mx-auto flex w-full max-w-sm items-center gap-1 rounded-full bg-cardx p-1"
                data-walkthrough="goal-library-tabs"
                role="group"
              >
                {TASK_LIBRARY_TABS.map((item) => (
                  <Pressable
                    aria-pressed={tab === item.tab}
                    className={cn(
                      'min-h-11 min-w-0 flex-1 items-center justify-center rounded-full px-1.5',
                      tab === item.tab ? 'bg-white' : '',
                    )}
                    key={item.filter}
                    onPress={() => selectFilter(item.filter)}
                  >
                    <Text
                      className={cn(
                        'whitespace-nowrap text-xs',
                        tab === item.tab
                          ? 'font-bold text-black'
                          : 'text-card-lighter-2',
                      )}
                    >
                      {item.tab}
                    </Text>
                  </Pressable>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(var(--safe-area-inset-bottom,0px)+1rem)] no-scrollbar">
              {tab === 'Paused' && showPausedInfo ? (
                <View className="mb-3 flex-row items-start gap-3 rounded-2xl bg-card-light-50 p-3">
                  <RiPauseLine
                    className="mt-0.5 shrink-0 text-warning-yellow"
                    size={17}
                  />
                  <Text className="flex-1 text-xs leading-4 text-card-lighter-2">
                    Paused tasks have no reminders or new occurrences until you
                    resume them.
                  </Text>
                  <Pressable
                    accessibilityLabel="Dismiss paused tasks information"
                    className="size-11 shrink-0 items-center justify-center rounded-full text-card-lighter-2"
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
                    <RiCloseLine size={16} />
                  </Pressable>
                </View>
              ) : null}
              <GoalFeed
                key={filter}
                filter={filter}
                search={searchQuery}
                onCreate={openCreate}
                onOpen={openGoal}
              />
            </div>
          </View>
        </>
      </NoiseComponent>
    </View>
  )
}
