import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { CommunityCard } from '@/components/custom/community/community-card.component'
import { CommunitiesHeaderMenuSheet } from '@/components/custom/community/communities-header-menu.sheet'
import { CreateCommunitySheet } from '@/components/custom/community/create-community-sheet.component'
import { JoinByCodeSheet } from '@/components/custom/community/join-by-code-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCommunities } from '@/hooks/use-communities.hook'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { hapticFeedback } from '@/shared/haptic.util'
import { cn } from '@/shared/utils/helpers.util'
import { RiGroup2Line, RiKeyLine, RiMore2Fill } from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type CommunitySubTab = 'ALL' | 'MINE' | 'JOINED'

export default function CommunitiesScreen() {
  const router = useRouter()
  const bottomSheet = useBottomSheetController()
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<CommunitySubTab>('ALL')
  const { data, isLoading, refetch, isFetching } = useCommunities(page, 10)

  const communities = data?.data || []
  const hasMore = data?.pagination?.hasNextPage || false

  const filtered = communities.filter((c: any) => {
    const role = c.userRole
    const isOwner = role === 'OWNER' || (!!user && c.ownerId === user.id)
    if (tab === 'MINE') return isOwner
    if (tab === 'JOINED') return !isOwner
    return true
  })

  useEffect(() => {
    hapticFeedback.light()
  }, [tab])

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

  const handleJoinByCode = () => {
    bottomSheet.present(
      <JoinByCodeSheet
        onSuccess={() => {
          refetch()
        }}
        onClose={() => bottomSheet.dismiss()}
      />,
      {
        title: 'Join by Code',
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

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
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

        <View className="px-mg">
          <View className="flex-row p-1 bg-card-light/30 rounded-full w-fit">
            {(['ALL', 'MINE', 'JOINED'] as const).map((t) => (
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
                    tab === t ? 'text-black font-semibold' : 'text-card-lighter-3',
                  )}
                >
                  {t === 'ALL' ? 'All' : t === 'MINE' ? 'Mine' : 'Joined'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="flex-1 px-mg mt-7 pb-20">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner />
            </View>
          ) : filtered.length === 0 ? (
            <EmptyList
              icon={<RiGroup2Line size={128} className="text-warning-yellow" />}
              title={
                tab === 'MINE'
                  ? 'No owned communities yet'
                  : tab === 'JOINED'
                    ? 'No joined communities yet'
                    : 'No communities yet'
              }
              description={
                tab === 'MINE'
                  ? 'Create a community to get started.'
                  : 'Create a community or join one using an invite code.'
              }
              action={{
                label: tab === 'MINE' ? 'Create community' : 'Join by code',
                onPress: tab === 'MINE' ? handleCreateCommunity : handleJoinByCode,
              }}
            />
          ) : (
            <VirtualList
              items={filtered}
              estimateSize={120}
              height={520}
              renderItem={(community, index) => (
                <>
                  {!(index === 0) && <hr className="border-card-lighter/20" />}
                  <CommunityCard
                    key={community.id}
                    community={community}
                    onPress={handleCommunityPress}
                  />
                </>
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

        {/* Bottom hint for joining */}
        {communities.length > 0 && (
          <View className="px-mg pb-safe">
            <Pressable
              onPress={handleJoinByCode}
              className="flex-row items-center justify-center gap-2 py-3 rounded-full bg-card-light/10 mb-2"
            >
              <RiKeyLine size={16} className="text-white/50" />
              <Text className="text-white/50 text-xs font-bbh">Have an invite code? Tap to join</Text>
            </Pressable>
          </View>
        )}
      </NoiseComponent>
    </View>
  )
}
