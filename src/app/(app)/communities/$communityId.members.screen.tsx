import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { MembersTab } from '@/components/custom/community/members-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCommunity, useCommunityMembers } from '@/hooks/use-communities.hook'
import { useParams, useRouter } from '@tanstack/react-router'

export default function CommunityMembersScreen() {
  const router = useRouter()
  const { communityId } = useParams({
    from: '/app/community/members/$communityId',
  })

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityMembers(communityId, 50)

  const members = membersData?.pages.flatMap((page) => page.data) || []

  const handleLoadMoreMembers = () => {
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
          <TabHeader canGoBack title="Community members" onBack={handleBack} />
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
          <TabHeader canGoBack title="Community members" onBack={handleBack} />
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
        <TabHeader canGoBack title="Community members" onBack={handleBack} />
        <View className="flex-1 px-mg pb-20">
          <MembersTab
            members={members}
            isLoading={isLoadingMembers || isFetchingNextPage}
            currentUserRole={community.userRole}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMoreMembers}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}
