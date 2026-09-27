import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { CommunitiesHeaderMenuSheet } from '@/components/custom/community/communities-header-menu.sheet'
import { CommunityCard } from '@/components/custom/community/community-card.component'
import { CreateCommunitySheet } from '@/components/custom/community/create-community-sheet.component'
import { JoinByCodeSheet } from '@/components/custom/community/join-by-code-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCommunities,
  useJoinCommunity,
  useMyCommunities,
} from '@/hooks/use-communities.hook'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Community } from '@/shared/api/community.api'
import { communityQueryKeys } from '@/shared/api/community.query-keys'
import { hapticFeedback } from '@/shared/haptic.util'
import { Dimensions } from '@/shared/utils/dimensions.util'
import { cn } from '@/shared/utils/helpers.util'
import { RiGroup2Line, RiKeyLine, RiMore2Fill } from '@remixicon/react'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type CommunitySubTab = 'ALL' | 'MINE' | 'JOINED'
type CommunityFeedKey = 'ALL' | 'MY'

function mergeCommunities(
  currentCommunities: Community[],
  nextCommunities: Community[],
): Community[] {
  const nextCommunityById = new Map(
    nextCommunities.map((community) => [community.id, community]),
  )
  const mergedCommunities = currentCommunities.map(
    (community) => nextCommunityById.get(community.id) ?? community,
  )
  const existingIds = new Set(
    currentCommunities.map((community) => community.id),
  )
  const appendedCommunities = nextCommunities.filter(
    (community) => !existingIds.has(community.id),
  )

  return [...mergedCommunities, ...appendedCommunities]
}

export default function CommunitiesScreen() {
  const router = useRouter()
  const bottomSheet = useBottomSheetController()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<CommunitySubTab>('ALL')
  const [communitiesByFeed, setCommunitiesByFeed] = useState<
    Record<CommunityFeedKey, Community[]>
  >({
    ALL: [],
    MY: [],
  })
  const [joiningCommunityId, setJoiningCommunityId] = useState<string | null>(
    null,
  )
  const discoverQuery = useCommunities(page, 20, true)
  const myCommunitiesQuery = useMyCommunities(page, 20)
  const { mutateAsync: joinCommunity } = useJoinCommunity()

  const activeQuery = tab === 'ALL' ? discoverQuery : myCommunitiesQuery
  const activeFeedKey: CommunityFeedKey = tab === 'ALL' ? 'ALL' : 'MY'
  const communities = communitiesByFeed[activeFeedKey]
  const hasMore = activeQuery.data?.pagination?.hasNextPage || false
  const isLoading = activeQuery.isLoading && communities.length === 0
  const isFetching = activeQuery.isFetching

  const filtered = communities.filter((community) => {
    const role = community.userRole
    const isOwner =
      role === 'OWNER' || (!!user && community.ownerId === user.id)
    if (tab === 'MINE') {
      return isOwner
    }
    if (tab === 'JOINED') {
      return !isOwner
    }
    return true
  })

  useEffect(() => {
    hapticFeedback.light()
    setPage(1)
  }, [tab])

  useEffect(() => {
    const nextCommunities = activeQuery.data?.data

    if (!nextCommunities) {
      return
    }

    setCommunitiesByFeed((currentFeeds) => ({
      ...currentFeeds,
      [activeFeedKey]:
        page === 1
          ? nextCommunities
          : mergeCommunities(currentFeeds[activeFeedKey], nextCommunities),
    }))
  }, [activeFeedKey, activeQuery.data, page])

  const handleCreateCommunity = () => {
    bottomSheet.present(
      <CreateCommunitySheet
        onSuccess={() => {
          bottomSheet.dismiss()
          void activeQuery.refetch()
        }}
      />,
      {
        title: 'Create Community',
        elevation: 9999,
      },
    )
  }

  const handleJoinByCode = () => {
    bottomSheet.present(
      <JoinByCodeSheet
        onSuccess={() => {
          void activeQuery.refetch()
        }}
        onClose={() => bottomSheet.dismiss()}
      />,
      {
        title: 'Join by Code',
        elevation: 9999,
      },
    )
  }

  const handleCommunityPress = (community: Community) => {
    router.navigate({ to: `/app/community/${community.id}` })
  }

  const handleQuickJoin = async (community: Community) => {
    if (community.isMember || joiningCommunityId) {
      return
    }

    setJoiningCommunityId(community.id)
    try {
      await joinCommunity(community.id)
    } finally {
      setJoiningCommunityId(null)
    }
  }

  const handleRefresh = async () => {
    const shouldRefetchCurrentPage = page === 1
    setPage(1)
    setCommunitiesByFeed((currentFeeds) => ({
      ...currentFeeds,
      [activeFeedKey]: [],
    }))
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.lists() }),
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.my() }),
    ])
    if (shouldRefetchCurrentPage) {
      await activeQuery.refetch()
    }
  }

  const handleOpenHeaderMenu = () => {
    bottomSheet.present(
      <CommunitiesHeaderMenuSheet
        onRefresh={handleRefresh}
        onJoinByCode={handleJoinByCode}
        onCreateCommunity={handleCreateCommunity}
        onClose={bottomSheet.dismiss}
      />,
      { title: 'Actions', elevation: 9999 },
    )
  }

  const ListHeader = () => (
    <View className="absolute w-full z-[999] ">
      <View className="relative bg-gradient-to-b from-[#06080c] from-[70%]">
        <TabHeader canGoBack={false} title="Communities">
          <View className="flex-row gap-2 w-full justify-end">
            <Pressable
              onPress={handleOpenHeaderMenu}
              className="w-12 h-12 rounded-full bg-card-light/20 flex items-center justify-center"
            >
              <RiMore2Fill size={22} className="text-white" />
            </Pressable>
          </View>
        </TabHeader>
      </View>

      <View className="px-msg  items-center">
        <View className="flex-row p-1 bg-card-light/30 backdrop-blur-xl rounded-full w-fit">
          {(['ALL', 'JOINED', 'MINE'] as const).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-full transition-colors',
                tab === t ? 'bg-white' : 'bg-transparent',
              )}
            >
              <Text
                className={cn(
                  'text-sm font-bbh',
                  tab === t
                    ? 'text-black font-semibold'
                    : 'text-card-lighter-3',
                )}
              >
                {t === 'ALL'
                  ? 'Discover'
                  : t === 'MINE'
                    ? 'Personal'
                    : 'Partcipating'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  )

  return (
    <View className="flex-1 relative bg-cardd ">
      <ListHeader />
      <NoiseComponent>
        <View className="flex-1 px-05.mg  pt-[200px] mt-1 h-full">
          {isLoading ? (
            <View>
              <View className="gap-3 px-mg py-4">
                {[1, 2, 3].map((item) => (
                  <View key={item} className="gap-3 rounded-2xl bg-cardx p-4">
                    <Skeleton className="h-5 w-3/4" rounded="sm" />
                    <Skeleton className="h-3 w-full" rounded="sm" />
                    <Skeleton className="h-3 w-1/2" rounded="sm" />
                  </View>
                ))}
              </View>
            </View>
          ) : filtered.length === 0 ? (
            <View>
              <EmptyList
                icon={
                  <RiGroup2Line size={128} className="text-warning-yellow" />
                }
                title={
                  tab === 'MINE'
                    ? 'No owned communities yet'
                    : tab === 'JOINED'
                      ? 'No joined communities yet'
                      : 'Nothing to discover yet'
                }
                description={
                  tab === 'MINE'
                    ? 'Create a community to get started.'
                    : tab === 'JOINED'
                      ? 'Join a community from All or use an invite code.'
                      : 'Create a community or join one using an invite code.'
                }
                action={{
                  label: tab === 'MINE' ? 'Create community' : 'Join by code',
                  onPress:
                    tab === 'MINE' ? handleCreateCommunity : handleJoinByCode,
                }}
              />
            </View>
          ) : (
            <VirtualList
              items={filtered}
              height={
                Dimensions.screenHeight -
                Dimensions.tabBarHeight -
                Dimensions.bottomSafePadding
              }
              estimateSize={120}
              renderItem={(community, index) => (
                <>
                  {!(index === 0) && <hr className="border-card-lighter/20" />}
                  <CommunityCard
                    key={community.id}
                    community={community}
                    isJoining={joiningCommunityId === community.id}
                    onJoin={tab === 'ALL' ? handleQuickJoin : undefined}
                    onPress={handleCommunityPress}
                    showDiscoverySignal={tab === 'ALL'}
                  />
                </>
              )}
              footer={
                <View className="pb-[50px]">
                  {hasMore ? (
                    <View className="">
                      <View className="py-4 pb-10 flex-row items-center justify-center">
                        <Button
                          label={isFetching ? 'Loading...' : 'Load More'}
                          variant="default"
                          fullWidth
                          onClick={() => setPage((p) => p + 1)}
                          disabled={isFetching}
                          textClassName="text-sm"
                          size="sm"
                        />
                      </View>
                      <BottomNotch />
                    </View>
                  ) : null}
                </View>
              }
            />
          )}
        </View>

        {/* Bottom hint for joining */}
        {communities.length > 0 && (
          <View className="px-mg pb-safe">
            <Pressable
              onPress={handleJoinByCode}
              className="flex-row items-center justify-center gap-2 py-3 rounded-full bg-card-light/10 mb-2"
            >
              <RiKeyLine size={16} className="text-white/50" />
              <Text className="text-white/50 text-xs font-bbh">
                Have an invite code? Tap to join
              </Text>
            </Pressable>
          </View>
        )}
      </NoiseComponent>
    </View>
  )
}
