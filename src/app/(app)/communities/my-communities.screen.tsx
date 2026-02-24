import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { CommunityCard } from '@/components/custom/community/community-card.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import { useMyCommunities } from '@/hooks/use-communities.hook'
import { RiGroupLine, RiRefreshLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export default function MyCommunitiesScreen() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch, isFetching } = useMyCommunities(page, 10)

  const communities = data?.data || []
  const hasMore = data?.pagination?.hasNextPage || false

  const handleCommunityPress = (community: any) => {
    router.navigate({ to: `/app/communities/${community.id}` })
  }

  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TopNotch />
        <TabHeader
          title="My Communities"
          children={
            <Pressable
              onPress={handleRefresh}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RiRefreshLine size={20} />
            </Pressable>
          }
        />

        <View className="flex-1 px-mg pb-20">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : communities.length === 0 ? (
            <EmptyList
              icon={<RiGroupLine size={48} className="text-white/40" />}
              title="No communities yet"
              description="Join or create a community to get started!"
              action={{
                label: 'Discover Communities',
                onPress: () => router.navigate({ to: '/app/communities' }),
              }}
            />
          ) : (
            <VirtualList
              items={communities}
              estimateSize={120}
              height={520}
              renderItem={(community) => (
                <CommunityCard
                  key={community.id}
                  community={community}
                  onPress={handleCommunityPress}
                />
              )}
              footer={
                hasMore ? (
                  <View className="py-4">
                    <Button
                      label={isFetching ? 'Loading...' : 'Load More'}
                      variant="default"
                      fullWidth
                      onClick={() => setPage((p) => p + 1)}
                      disabled={isFetching}
                      textClassName="text-sm"
                    />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
