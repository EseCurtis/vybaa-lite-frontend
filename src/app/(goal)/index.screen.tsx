import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { Skeleton } from '@/components/common/skeleton.component'
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
import { goalNeedsAttention } from '@/shared/goal/goal-due.util'
import {
  cn,
  contrastingTextColor,
  seededColor,
} from '@/shared/utils/helpers.util'
import {
  RiAddLine,
  RiArchiveLine,
  RiArrowRightSLine,
  RiCalendarCheckLine,
  RiCloseLine,
  RiPauseLine,
  RiTargetLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState, type ReactNode } from 'react'

type GoalTab = 'Active' | 'Ended' | 'Paused'

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
  const color = seededColor(goal.title)
  const textColor = contrastingTextColor(color)
  const progress = Math.min(100, Math.max(0, goal.progress.percentage))
  const targetSummary =
    goal.target.type === 'QUANTITY'
      ? `${goal.progress.value.toLocaleString()} / ${goal.target.amount.toLocaleString()} ${goal.target.unit ?? ''}`
      : goal.target.type === 'CHECK_IN_COUNT'
        ? `${goal.progress.completedOccurrences} / ${goal.target.count} check-ins`
        : `${Math.round(goal.progress.adherenceRate)}% adherence`
  const nextSummary = goal.nextOccurrence
    ? `Next ${new Date(goal.nextOccurrence.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : targetSummary
  const needsAttention = goalNeedsAttention(goal)
  const dueLabel = goal.isOverdue ? 'Overdue' : 'Due'
  return (
    <Pressable
      accessibilityLabel={`${goal.title}${needsAttention ? `, ${dueLabel}` : ''}`}
      className="mb-2 flex flex-col gap-2 text-left rounded-2xl bg-card-light-50 pt-1 p-2 pr-3"
      onPress={() => onOpen(goal)}
    >
      <View className="flex-row items-center   gap-3">
        <View
          className="size-11 items-center justify-center rounded-lg overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <Text
            className="text-lg font-bold scale-[3.5] opacity-35 rotate-45"
            style={{ color: textColor }}
          >
            {goal.title.trim().charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-left truncate text-base font-bold text-white">
              {goal.title}
            </Text>
            {needsAttention ? (
              <span
                aria-label={dueLabel}
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-danger-500"
                role="status"
                title={dueLabel}
              />
            ) : null}
          </View>
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] font-bold text-card-lighter-2">
              {Math.round(progress)}%
            </Text>
            <View className="h-1 w-full max-w-[75%] overflow-hidden rounded-full bg-card-light">
              <View
                className="h-full rounded-full bg-card-lighter-3"
                style={{ width: `${progress}%` }}
              />
            </View>
          </View>
        </View>
        <RiArrowRightSLine className="text-card-lighter-2 hidden" size={20} />
      </View>
      <View className="px-1 flex-row w-full justify-between truncate text-[11px] text-card-lighter-2">
        <Text className="text-[10px] font-bold capitalize text-card-lighter-2">
          {goal.status.replace('_', ' ').toLowerCase()}
        </Text>
        <Text className="">{nextSummary}</Text>
      </View>
    </Pressable>
  )
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
                  'Permanently delete this legacy goal? Historical reward transactions will remain.',
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
    <View className="items-center rounded-3xl bg-card-light-50 px-6 py-12 text-center">
      <View className="mb-4 size-12 items-center justify-center rounded-2xl bg-card-light">
        {icon}
      </View>
      <Text className="text-lg font-bold">{title}</Text>
      <Text className="mt-2 max-w-xs text-center text-sm leading-5 text-card-lighter-2">
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
      description: 'No active goal has slipped past its scheduled day.',
      icon: <RiCalendarCheckLine className="text-card-lighter-2" size={22} />,
      title: 'No overdue goals',
    }
  }
  if (filter === 'PAUSED') {
    return {
      description:
        'Goals you pause will appear here while their schedule is on hold.',
      icon: <RiPauseLine className="text-card-lighter-2" size={22} />,
      title: 'Nothing paused',
    }
  }
  if (filter === 'ENDED') {
    return {
      description:
        'Completed and abandoned goals will become part of your history here.',
      icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
      title: 'Your history is clear',
    }
  }
  if (filter === 'ARCHIVED') {
    return {
      description:
        'Archived goals stay out of your active library but remain available here.',
      icon: <RiArchiveLine className="text-card-lighter-2" size={22} />,
      title: 'No archived goals',
    }
  }
  return {
    actionLabel: 'Create a goal',
    description: 'Choose one small finish line and build from there.',
    icon: <RiTargetLine className="text-card-lighter-2" size={22} />,
    title: 'Start with one goal',
  }
}

function GoalFeed({
  filter,
  onCreate,
  onOpen,
}: {
  filter: GoalListFilter
  onCreate: () => void
  onOpen: (goal: Goal) => void
}) {
  const query = useInfiniteGoals({ filter })
  const goals = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  )
  if (query.isLoading) {
    return (
      <View className="space-y-2">
        {[0, 1, 2].map((item) => (
          <View
            className="flex-row items-center gap-3 rounded-2xl bg-card-light-50 p-3"
            key={item}
          >
            <Skeleton className="size-11" rounded="lg" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-3/5" rounded="sm" />
              <Skeleton className="h-2 w-4/5" rounded="full" />
            </View>
            <Skeleton className="h-3 w-10" rounded="sm" />
          </View>
        ))}
      </View>
    )
  }
  if (!goals.length) {
    const emptyState = emptyStateForFilter(filter)
    return <GoalEmptyState {...emptyState} onAction={onCreate} />
  }
  return (
    <View>
      {goals.map((goal) => (
        <GoalCard goal={goal} key={goal.id} onOpen={onOpen} />
      ))}
      {query.hasNextPage ? (
        <Pressable
          className="mx-auto rounded-full bg-card-light px-5 py-3"
          onPress={() => query.fetchNextPage()}
        >
          <Text>{query.isFetchingNextPage ? 'Loading…' : 'Load more'}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

export default function GoalsAppScreen() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<GoalTab>('Active')
  const [activeFilter, setActiveFilter] = useState<
    'ACTIVE' | 'DUE' | 'OVERDUE'
  >('ACTIVE')
  const [endedFilter, setEndedFilter] = useState<'ARCHIVED' | 'ENDED'>('ENDED')
  const [showPausedInfo, setShowPausedInfo] = useState(
    () => !hasDismissedPausedInfo(),
  )
  const legacy = useLegacyGoals(tab === 'Ended')

  function openGoal(goal: Goal): void {
    navigate({ to: '/app/goal/$goalId', params: { goalId: goal.id } })
  }

  function openCreate(): void {
    navigate({ to: '/app/goal/create' })
  }

  const filter: GoalListFilter =
    tab === 'Paused' ? 'PAUSED' : tab === 'Ended' ? endedFilter : activeFilter

  return (
    <View className="flex-1 min-h-0 bg-cardd">
      <TopNotch />
      <NoiseComponent>
        <View
          className="flex-1 min-h-0 overflow-y-scroll overscroll-contain px-mg pb-28 no-scrollbar"
          style={{ height: 0, minHeight: 0 }}
        >
          <View className="mb-5 mt-2 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold">Goals</Text>
            </View>
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white"
              onPress={openCreate}
            >
              <RiAddLine className="text-black" size={22} />
            </Pressable>
          </View>

          <View className="sticky top-0 z-30 -mx-mg flex-row items-center justify-center bg-cardd py-2">
            <View className="justify-center rounded-full bg-cardx flex-row gap-2 p-1">
              {(['Active', 'Paused', 'Ended'] as GoalTab[]).map((item) => (
                <Pressable
                  className={cn(
                    'rounded-full px-3 py-2',
                    tab === item ? 'bg-white' : 'bg-transparent',
                  )}
                  key={item}
                  onPress={() => setTab(item)}
                >
                  <Text
                    className={
                      tab === item
                        ? 'font-bold text-sm text-black'
                        : 'text-card-lighter-2'
                    }
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {tab === 'Active' ? (
            <View className="mb-4 flex-row justify-end gap-2 border-y pt-2 border-card-lighter/20">
              {(
                [
                  { icon: RiCalendarCheckLine, label: 'All', value: 'ACTIVE' },
                  { icon: RiCalendarCheckLine, label: 'Due', value: 'DUE' },
                  { icon: RiArchiveLine, label: 'Overdue', value: 'OVERDUE' },
                ] as const
              ).map((item) => (
                <Pressable
                  style={
                    {
                      '--tw-active-border-color': seededColor(item.value),
                    } as any
                  }
                  className={cn(
                    'flex-row border-b-2 items-center gap-1 px-3 pb-3.5 pt-1.5',
                    activeFilter === item.value
                      ? 'border-[var(--tw-active-border-color)]'
                      : 'border-card-light-50',
                  )}
                  key={item.value}
                  onPress={() => setActiveFilter(item.value)}
                >
                  <item.icon
                    size={13}
                    className="text-[var(--tw-active-border-color)]"
                  />
                  <Text className="text-xs">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {tab === 'Ended' ? (
            <View className="mb-4 flex-row justify-end gap-2 border-y border-card-lighter/20 pt-2">
              {(['ENDED', 'ARCHIVED'] as const).map((item) => (
                <Pressable
                  style={
                    {
                      '--tw-active-border-color': seededColor(item),
                    } as any
                  }
                  className={cn(
                    'flex-row items-center gap-1 border-b-2 px-3 pb-3.5 pt-1.5',
                    endedFilter === item
                      ? 'border-[var(--tw-active-border-color)]'
                      : 'border-card-light-50',
                  )}
                  key={item}
                  onPress={() => setEndedFilter(item)}
                >
                  {item === 'ENDED' ? (
                    <RiCalendarCheckLine
                      className="text-[var(--tw-active-border-color)]"
                      size={13}
                    />
                  ) : (
                    <RiArchiveLine
                      className="text-[var(--tw-active-border-color)]"
                      size={13}
                    />
                  )}
                  <Text className="text-xs">
                    {item === 'ENDED' ? 'History' : 'Archived'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <GoalFeed filter={filter} onCreate={openCreate} onOpen={openGoal} />

          {tab === 'Ended' && legacy.data?.length ? (
            <View className="mt-8">
              <Text className="mb-1 font-bold">Legacy</Text>
              <Text className="mb-4 text-xs text-card-lighter-2">
                Goals from the old streak system are preserved as read-only
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
                description="Older streak-based goals will appear here as read-only history."
                icon={
                  <RiArchiveLine className="text-card-lighter-2" size={20} />
                }
                title="No legacy goals"
              />
            </View>
          ) : null}

          {tab === 'Paused' && showPausedInfo ? (
            <View
              className="fixed bottom-24 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[368px] -translate-x-1/2 flex-row items-start gap-3 rounded-2xl p-4"
              style={{ backgroundColor: '#4a2f12' }}
            >
              <RiPauseLine
                className="mt-0.5 shrink-0 text-warning-yellow"
                size={17}
              />
              <Text className="flex-1 text-xs leading-4 text-warning-yellow">
                Paused goals take a break: no reminders, new occurrences, or
                missed days are recorded.
              </Text>
              <Pressable
                accessibilityLabel="Dismiss paused goals information"
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
        </View>
      </NoiseComponent>
    </View>
  )
}
