import { Spinner } from '@/components/common/spinner.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import { cn, normalizePages } from '@/shared/utils/helpers.util'
import { useMemo, useState } from 'react'
import { GoalCard } from './goal-card.compoent'

const tabs = ['All', 'Due']
const filterTabMap = {
  [tabs[0]]: {},
  [tabs[1]]: { canCheckIn: true },
}

export function GoalList() {
  const [tab, setTab] = useState(tabs?.[0])
  const filter = useMemo(() => {
    return filterTabMap[tab]
  }, [tab])

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteGoals(filter)
  const goals = normalizePages(data?.pages)

  return (
    <View className="flex-1">
      <View className="flex-row gap-3 px-mg mb-4 mt-2 w-full">
        {tabs.map((item, index) => {
          const active = tab == item
          return (
            <Pressable
              onPress={() => {
                setTab(item)
              }}
              className={cn(
                'shrink-0 rounded-2xl px-3 py-2 ',
                active ? 'bg-white' : 'bg-card-lighter-2',
              )}
              key={index}
            >
              <Text className="text-black text-sm font-bold">{item}</Text>
            </Pressable>
          )
        })}
      </View>
      <View className="px-mg">
        <VirtualList
          items={goals}
          renderItem={(goal, index) => {
            return <GoalCard {...goal} />
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
      </View>
    </View>
  )
}
