import { Spinner } from '@/components/common/spinner.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import { normalizePages } from '@/shared/utils/helpers.util'
import { GoalCard } from './goal-card.compoent'

export function GoalList() {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteGoals()
  const goals = normalizePages(data?.pages)

  return (
    <View className="flex-1">
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
