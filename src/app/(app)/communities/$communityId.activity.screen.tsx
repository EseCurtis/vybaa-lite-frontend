import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ActivityTab } from '@/components/custom/community/activity-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useActivityFeed,
  useCommunity,
  useReactToActivity,
} from '@/hooks/use-communities.hook'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export default function CommunityActivityScreen() {
  const router = useRouter()
  const { communityId } = useParams({
    from: '/app/community/activity/$communityId',
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const {
    data: community,
    isLoading: isLoadingCommunity,
    refetch: refetchCommunity,
  } = useCommunity(communityId)
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchActivity,
  } = useActivityFeed(communityId, 20)
  const {
    mutate: reactToActivity,
    isPending: isReacting,
    variables: reactingActivityId,
  } = useReactToActivity(communityId)

  const activities = activityData?.pages.flatMap((page) => page.data) || []

  const handleLoadMoreActivity = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleBack = () => {
    router.navigate({
      params: { communityId },
      replace: true,
      to: '/app/community/$communityId',
    })
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refetchCommunity(), refetchActivity()])
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoadingCommunity) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Community activity" onBack={handleBack} />
          <View className="gap-3 px-mg py-4">
            {[1, 2, 3].map((item) => (
              <View key={item} className="gap-3 rounded-2xl bg-cardx p-4">
                <View className="flex-row items-center gap-3">
                  <Skeleton className="size-10" rounded="full" />
                  <Skeleton className="h-3 w-1/2" rounded="sm" />
                </View>
                <Skeleton className="h-4 w-full" rounded="sm" />
              </View>
            ))}
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (!community) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Community activity" onBack={handleBack} />
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-white/60 text-lg font-bbh text-center">
              Community not found
            </Text>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader canGoBack title="Community activity" onBack={handleBack} />
        <View className="flex-1 px-mg ">
          <ActivityTab
            communityId={communityId}
            activities={activities}
            isLoading={isLoadingActivity || isFetchingNextPage}
            onReact={reactToActivity}
            onComment={() => {}}
            reactingActivityId={isReacting ? reactingActivityId : null}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMoreActivity}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}
