import { EmptyList } from '@/components/common/empty-list.component'
import { Spinner } from '@/components/common/spinner.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { cn, normalizePages } from '@/shared/utils/helpers.util'
import { RiCheckboxCircleLine, RiTrophyLine } from '@remixicon/react'
import { useMemo, useState } from 'react'
import { GoalCard } from './goal-card.compoent'

const tabs = ['All', 'Due']
const filterTabMap = {
  [tabs[0]]: {},
  [tabs[1]]: { canCheckIn: true },
}

interface GoalListProps {
  onGoalClick?: (goal: Goal) => void
  onCreateGoal?: () => void
  bulkMode?: boolean
  selectedGoals?: Set<string>
  onToggleSelection?: (goalId: string) => void
}

export function GoalList({ 
  onGoalClick, 
  onCreateGoal,
  bulkMode = false,
  selectedGoals = new Set(),
  onToggleSelection,
}: GoalListProps) {
  const [tab, setTab] = useState(tabs?.[0])
  const filter = useMemo(() => {
    return filterTabMap[tab]
  }, [tab])

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteGoals(filter)
  const goals = normalizePages(data?.pages)
  
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <View className="flex-1 ">
      <View className="flex-row gap-3 px-mg mb-4 mt-2 w-full">
        {tabs.map((item, index) => {
          const active = tab == item
          return (
            <Pressable
              onPress={() => {
                setTab(item)
              }}
              className={cn(
                'shrink-0 border border-card-lighter-3/20 rounded-full px-4 py-2 ',
                active ? 'bg-white text-black' : 'bg-transparent !text-white',
              )}
              key={index}
            >
              <Text className=" text-sm font-bold">{item}</Text>
            </Pressable>
          )
        })}
      </View>
      <View className="px-mg flex-1">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Spinner size={32} />
          </View>
        ) : goals.length === 0 ? (
          tab === 'All' ? (
            <EmptyList
              icon={<RiTrophyLine size={64} className="text-white" />}
              title="No goals yet"
              description="Start your journey by creating your first goal"
              action={
                onCreateGoal
                  ? {
                      label: 'Create goal',
                      onPress: onCreateGoal,
                    }
                  : undefined
              }
            />
          ) : (
            <EmptyList
              icon={<RiCheckboxCircleLine size={64} className="text-white" />}
              title="All caught up!"
              description="No goals to check in today. Great work!"
            />
          )
        ) : (
          <VirtualList
            items={goals}
            renderItem={(goal, index) => {
              return (
                <GoalCard 
                  {...goal} 
                  onPress={onGoalClick}
                  bulkMode={bulkMode}
                  isSelected={selectedGoals.has(goal.id)}
                  onToggleSelection={onToggleSelection}
                />
              )
            }}
            footer={
              hasNextPage && (
                <Pressable
                  onPress={() => {
                    fetchNextPage()
                  }}
                  className="snap-center ml-2 text-card-lighter-3  bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-4 font-bold"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Text className="whitespace-nowrap text-sm">Loading</Text>{' '}
                      <Spinner size={17} />
                    </>
                  ) : (
                    <Text className="whitespace-nowrap text-sm">Load more</Text>
                  )}
                </Pressable>
              )
            }
          />
        )}
      </View>
    </View>
  )
}
