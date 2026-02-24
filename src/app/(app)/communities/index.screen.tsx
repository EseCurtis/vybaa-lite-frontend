import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { Spinner } from '@/components/common/spinner.component'
import { CommunityCard } from '@/components/custom/community/community-card.component'
import { CreateCommunitySheet } from '@/components/custom/community/create-community-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCommunities,
  useCreateCommunity,
} from '@/hooks/use-communities.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { RiAddLine, RiGroup2Line, RiRefreshLine } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

export default function CommunitiesDiscoverScreen() {
  const router = useRouter()
  //get the current route
  const bottomSheet = useBottomSheetController()
  const [page, setPage] = useState(1)
  const { data, isLoading, refetch, isFetching } = useCommunities(
    page,
    10,
    true,
  )

  
  const { mutateAsync: createCommunity } = useCreateCommunity()

  const communities = data?.data || []
  const hasMore = data?.pagination?.hasNextPage || false

  const handleCreateCommunity = () => {
    bottomSheet.present(
      <CreateCommunitySheet
        onSuccess={() => {
          bottomSheet.dismiss()
          refetch()
        }}
      />,
      {
        title: 'Create Community',
        elevation: 9999,
      },
    )
  }

  const handleCommunityPress = (community: any) => {
    router.navigate({ to: `/app/community/${community.id}` })
  }

  const handleRefresh = async () => {
    await refetch()
  }

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TopNotch />
        <View className=""><Text className="text-white text-sm break-words p-mg">{location.href}</Text></View>
        <View className="flex-row gap-2 w-full p-mg justify-end">
          
          <Pressable
            onPress={handleRefresh}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RiRefreshLine size={20} />
          </Pressable>
          <Pressable
            onPress={handleCreateCommunity}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RiAddLine size={22} />
          </Pressable>
        </View>

        <View className="flex-1 px-mg pb-20">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : communities.length === 0 ? (
            <EmptyList
              icon={<RiGroup2Line size={128} className="text-warning-yellow" />}
              title="No communities yet"
              description="Be the first to create a community and start sharing goals!"
              action={{
                label: 'Create',
                onPress: handleCreateCommunity,
              }}
            />
          ) : (
            <>
              <View className="py-4">
                {communities.map((community) => (
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onPress={handleCommunityPress}
                  />
                ))}
              </View>

              {hasMore && (
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
              )}
            </>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
