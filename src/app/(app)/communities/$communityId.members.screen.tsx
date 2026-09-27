import { NoiseComponent } from '@/components/common/noise.component'
import { PullToRefresh } from '@/components/common/pull-to-refresh.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { MembersTab } from '@/components/custom/community/members-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCommunity, useCommunityMembers } from '@/hooks/use-communities.hook'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export default function CommunityMembersScreen() {
  const router = useRouter()
  const { communityId } = useParams({
    from: '/app/community/members/$communityId',
  })

  const [isRefreshing, setIsRefreshing] = useState(false)
  const {
    data: community,
    isLoading: isLoadingCommunity,
    refetch: refetchCommunity,
  } = useCommunity(communityId)
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMembers,
  } = useCommunityMembers(communityId, 50)

  const members = membersData?.pages.flatMap((page) => page.data) || []

  const handleLoadMoreMembers = () => {
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
      await Promise.all([refetchCommunity(), refetchMembers()])
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoadingCommunity) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Community members" onBack={handleBack} />
          <View className="gap-3 px-mg py-4">
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                className="flex-row items-center gap-3 rounded-2xl bg-cardx p-4"
              >
                <Skeleton className="size-11" rounded="full" />
                <View className="flex-1 gap-2">
                  <Skeleton className="h-4 w-1/2" rounded="sm" />
                  <Skeleton className="h-3 w-1/3" rounded="sm" />
                </View>
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
        <PullToRefresh
          className="flex-1 overflow-y-auto no-scrollbar"
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          <View className="flex-1 px-mg pb-20">
            <MembersTab
              members={members}
              isLoading={isLoadingMembers || isFetchingNextPage}
              currentUserRole={community.userRole}
              hasNextPage={hasNextPage}
              onLoadMore={handleLoadMoreMembers}
            />
          </View>
        </PullToRefresh>
      </NoiseComponent>
    </View>
  )
}
