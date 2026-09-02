import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
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
  cn,
  contrastingTextColor,
  seededColor,
} from '@/shared/utils/helpers.util'
import {
  RiAddLine,
  RiArchiveLine,
  RiArrowRightSLine,
  RiCalendarCheckLine,
  RiPauseLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

type GoalTab = 'Active' | 'Ended' | 'Paused'

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
  return (
    <Pressable
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
  return (
    <View className="mb-3 rounded-2xl bg-card-light/60 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-bold text-white">{goal.title}</Text>
        <Text className="rounded-full bg-card-light-50 px-2 py-1 text-[10px] text-card-lighter-2">
          LEGACY
        </Text>
      </View>
      <Text className="mt-2 text-xs text-card-lighter-2">
        Read-only · {goal.currentDay} of {goal.targetDays} historical check-ins
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-2">
        <Pressable
          className="rounded-full bg-card-lighter-3 px-3 py-2"
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
            className="rounded-full bg-danger-500/10 px-3 py-2"
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

function GoalFeed({
  filter,
  onOpen,
}: {
  filter: GoalListFilter
  onOpen: (goal: Goal) => void
}) {
  const query = useInfiniteGoals({ filter })
  const goals = useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  )
  if (query.isLoading) {
    return (
      <Text className="py-12 text-center text-card-lighter-2">
        Loading goals…
      </Text>
    )
  }
  if (!goals.length) {
    return (
      <Text className="py-12 text-center text-card-lighter-2">
        Nothing here yet.
      </Text>
    )
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
    <View className="flex-1 bg-cardd">
      <TopNotch />
      <NoiseComponent>
        <View className="flex-1 overflow-y-auto px-mg pb-28 no-scrollbar">
          <View className="mb-5 mt-2 flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold">Goals</Text>
              <Text className="text-sm text-card-lighter-2">
                Progress with a proper finish.
              </Text>
            </View>
            <Pressable
              className="size-11 items-center justify-center rounded-full bg-white"
              onPress={openCreate}
            >
              <RiAddLine className="text-black" size={22} />
            </Pressable>
          </View>

          <View className="flex-row items-center justify-center">
            <View className="mb-4 justify-center bg-cardx flex-row gap-2 p-1 rounded-full">
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

          {tab === 'Paused' ? (
            <View className="mb-3 flex-row items-center gap-2">
              <RiPauseLine className="text-card-lighter-2" size={15} />
              <Text className="text-xs text-card-lighter-2">
                Paused schedules do not generate misses or reminders.
              </Text>
            </View>
          ) : null}

          {tab === 'Ended' ? (
            <View className="mb-4 flex-row gap-2">
              {(['ENDED', 'ARCHIVED'] as const).map((item) => (
                <Pressable
                  className={cn(
                    'rounded-full px-3 py-1.5',
                    endedFilter === item ? 'bg-purple-500' : 'bg-card-light-50',
                  )}
                  key={item}
                  onPress={() => setEndedFilter(item)}
                >
                  <Text className="text-xs">
                    {item === 'ENDED' ? 'History' : 'Archived'}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <GoalFeed filter={filter} onOpen={openGoal} />

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
        </View>
      </NoiseComponent>
    </View>
  )
}
