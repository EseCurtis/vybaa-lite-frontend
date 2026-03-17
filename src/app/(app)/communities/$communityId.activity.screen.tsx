import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ActivityTab } from '@/components/custom/community/activity-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useActivityFeed,
  useCommunity,
} from '@/hooks/use-communities.hook'
import { useParams, useRouter } from '@tanstack/react-router'

export default function CommunityActivityScreen() {
  const router = useRouter()
  const { communityId } = useParams({ from: '/app/community/activity/$communityId' })

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useActivityFeed(communityId,20)

  const activities = activityData?.pages.flatMap((page) => page.data) || []

  const handleLoadMoreActivity = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleBack = () => {
   history.back()
  }

  if (isLoadingCommunity) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Community activity" onBack={handleBack} />
          <View className="flex-1 items-center justify-center">
            <Spinner />
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
            activities={activities}
            isLoading={isLoadingActivity || isFetchingNextPage}
            onReact={() => {}}
            onComment={() => {}}
            reactingActivityId={null}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMoreActivity}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}

