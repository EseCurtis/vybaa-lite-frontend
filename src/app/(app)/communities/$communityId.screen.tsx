import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { PullToRefresh } from '@/components/common/pull-to-refresh.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ActivityTab } from '@/components/custom/community/activity-tab.component'
import { CommunityBackground } from '@/components/custom/community/community-background.component'
import { CommunityHeaderMenuSheet } from '@/components/custom/community/community-header-menu.sheet'
import { CommunityHeader } from '@/components/custom/community/community-header.component'
import { CommunitySettingsSheet } from '@/components/custom/community/community-settings-sheet.component'
import { CommunityTabs } from '@/components/custom/community/community-tabs.component'
import { CreateTemplateSheet } from '@/components/custom/community/create-template-sheet.component'
import { InviteSheet } from '@/components/custom/community/invite-sheet.component'
import { MembersTab } from '@/components/custom/community/members-tab.component'
import { ModerationTab } from '@/components/custom/community/moderation-tab.component'
import { StartGoalConfirmationSheet } from '@/components/custom/community/start-goal-confirmation-sheet.component'
import { TemplatesTab } from '@/components/custom/community/templates-tab.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useActivityFeed,
  useCommunity,
  useCommunityMembers,
  useCommunityStats,
  useJoinCommunity,
  useLeaveCommunity,
  useReactToActivity,
  useStartGoalFromTemplate,
  useTemplates,
} from '@/hooks/use-communities.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { communityQueryKeys } from '@/shared/api/community.query-keys'
import { hapticFeedback } from '@/shared/haptic.util'
import { RiMore2Fill } from '@remixicon/react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useNavigate,
  useParams,
  useRouter,
  useRouterState,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'

type Tab = 'templates' | 'activity' | 'members' | 'moderation'

const defaultCommunityTab: Tab = 'templates'

function getCommunityTabFromHash(hash: string, showModeration: boolean): Tab {
  const normalizedHash = hash.startsWith('#') ? hash.slice(1) : hash

  if (normalizedHash === 'activity') {
    return 'activity'
  }

  if (normalizedHash === 'members') {
    return 'members'
  }

  if (normalizedHash === 'moderation' && showModeration) {
    return 'moderation'
  }

  return defaultCommunityTab
}

function getCommunityTabHash(tab: Tab): string {
  return tab === defaultCommunityTab ? '' : tab
}

export default function CommunityDetailScreen() {
  const router = useRouter()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { communityId } = useParams({ from: '/app/community/$communityId' })
  const locationHash = useRouterState({
    select: (state) => state.location.hash,
  })
  const bottomSheet = useBottomSheetController()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [reactingActivityId, setReactingActivityId] = useState<string | null>(
    null,
  )

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const { data: stats } = useCommunityStats(communityId)
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    fetchNextPage: fetchNextTemplates,
    hasNextPage: hasNextTemplates,
  } = useTemplates(communityId, 20)
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    fetchNextPage: fetchNextActivity,
    hasNextPage: hasNextActivity,
  } = useActivityFeed(communityId, 20)
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    fetchNextPage: fetchNextMembers,
    hasNextPage: hasNextMembers,
  } = useCommunityMembers(communityId, 50)
  const { mutateAsync: joinCommunity } = useJoinCommunity()
  const { mutateAsync: leaveCommunity } = useLeaveCommunity()
  const { mutateAsync: startGoal, isPending: isStartingGoal } =
    useStartGoalFromTemplate()
  const { mutateAsync: reactToActivity } = useReactToActivity(communityId)
  const templates = templatesData?.pages.flatMap((page) => page.data) || []
  const activities = activityData?.pages.flatMap((page) => page.data) || []
  const members = membersData?.pages.flatMap((page) => page.data) || []
  const isMember = community?.isMember || false
  const userRole = community?.userRole
  const isOwner = userRole === 'OWNER'
  const activeTab = getCommunityTabFromHash(locationHash, isOwner)



  useEffect(() => {
    const normalizedTab = getCommunityTabFromHash(locationHash, isOwner)
    const normalizedHash = getCommunityTabHash(normalizedTab)
    const currentHash = locationHash.startsWith('#')
      ? locationHash.slice(1)
      : locationHash

    if (currentHash === normalizedHash) {
      return
    }

    void navigate({
      to: '/app/community/$communityId',
      params: { communityId },
      hash: normalizedHash,
      replace: true,
    })
  }, [communityId, isOwner, locationHash, navigate])



    useEffect(() => {
    hapticFeedback.light()
  }, [activeTab])

  const handleJoin = async () => {
    try {
      await joinCommunity(communityId)
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this community?')) {
      try {
        await leaveCommunity(communityId)
        router.navigate({ to: '/app/communities' })
      } catch (error) {
        // Error handled in hook
      }
    }
  }

  const handleCreateTemplate = () => {
    bottomSheet.present(
      <CreateTemplateSheet
        communityId={communityId}
        onSuccess={() => {
          bottomSheet.dismiss()
        }}
      />,
      {
        title: 'Create Template',
      },
    )
  }

  const handleRefreshCommunity = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.detail(communityId),
        }),
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.membersRoot(communityId),
        }),
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.templatesRoot(communityId),
        }),
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.activityRoot(communityId),
        }),
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.stats(communityId),
        }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleOpenHeaderMenu = () => {
    bottomSheet.present(
      <CommunityHeaderMenuSheet
        isMember={isMember}
        userRole={userRole}
        onJoin={handleJoin}
        onLeave={handleLeave}
        onCreateTemplate={handleCreateTemplate}
        onOpenSettings={handleOpenSettings}
        onRefresh={handleRefreshCommunity}
        onInvite={handleInvite}
        onClose={bottomSheet.dismiss}
      />,
      { title: 'Actions', elevation: 9999 },
    )
  }

  const handleOpenSettings = () => {
    if (!community) return
    bottomSheet.present(
      <CommunitySettingsSheet
        community={community}
        onClose={bottomSheet.dismiss}
        onDeleted={() => {
          router.navigate({ to: '/app/communities' })
        }}
      />,
      { title: 'Community settings' },
    )
  }

  const handleInvite = () => {
    if (!community) return
    bottomSheet.present(
      <InviteSheet communityId={community.id} communityName={community.name} />,
      { title: 'Invite to Community' },
    )
  }

  const handleStartGoal = (template: any) => {
    bottomSheet.present(
      <StartGoalConfirmationSheet
        template={template}
        onConfirm={async () => {
          try {
            await startGoal({ templateId: template.id })
            bottomSheet.dismiss()
            router.navigate({ to: '/app/goal' })
          } catch (error) {
            // Error handled in hook
            bottomSheet.dismiss()
          }
        }}
        onCancel={() => bottomSheet.dismiss()}
        isStarting={isStartingGoal}
      />,
      {
        title: 'Start this goal?',
      },
    )
  }

  const handleReact = async (activityId: string) => {
    try {
      setReactingActivityId(activityId)
      await reactToActivity(activityId)
    } catch (error) {
      // Error handled in hook
    } finally {
      setReactingActivityId(null)
    }
  }

  const handleComment = (activityId: string) => {
    // TODO: Implement comment sheet
    console.log('Comment on activity', activityId)
  }

  const handleLoadMoreTemplates = () => {
    if (hasNextTemplates) {
      fetchNextTemplates()
    }
  }

  const handleLoadMoreActivity = () => {
    if (hasNextActivity) {
      fetchNextActivity()
    }
  }

  const handleLoadMoreMembers = () => {
    if (hasNextMembers) {
      fetchNextMembers()
    }
  }

  const handleShowAllActivity = () => {
    router.navigate({
      to: `/app/community/activity/${communityId}`,
    })
  }

  const handleShowAllMembers = () => {
    router.navigate({
      to: `/app/community/members/${communityId}`,
    })
  }

  const handleShowAllGoals = () => {
    router.navigate({
      to: `/app/community/goals/${communityId}`,
    })
  }

  const handleTabChange = (nextTab: Tab) => {
    void navigate({
      to: '/app/community/$communityId',
      params: { communityId },
      hash: getCommunityTabHash(nextTab),
      replace: true,
    })
  }

  if (isLoadingCommunity) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Community" />
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
          <TabHeader title="Community" />
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
      <View className="absolute top-0 left-0 w-full z-[999] backdrop-blur-xl bg-cardd/30">
        <TabHeader
          title={"Community"}
          children={
            <Pressable
              onPress={handleOpenHeaderMenu}
              className="w-12 h-12 rounded-full bg-card-light/20 flex items-center justify-center"
            >
              <RiMore2Fill size={22} className="text-white" />
            </Pressable>
          }
        />
      </View>

      <CommunityBackground communityName={community.name} />
      <PullToRefresh
        className="flex-1 overflow-y-auto no-scrollbar"
        onRefresh={handleRefreshCommunity}
        refreshing={isRefreshing}
      >
        <NoiseComponent>
          <View className="z-10 relative ">
            <TopNotch />
            <View className="mt-24" />

            <CommunityHeader community={community} stats={stats} />

            <View className="">
              <CommunityTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
                showModeration={isOwner}
              />
            </View>

            <View className="flex-1 px-mg pb-20">
              {activeTab === 'templates' && (
                <TemplatesTab
                  templates={templates.slice(0, 4)}
                  isLoading={isLoadingTemplates}
                  isMember={isMember}
                  userRole={userRole}
                  onCreateTemplate={handleCreateTemplate}
                  onStartGoal={handleStartGoal}
                  hasNextPage={hasNextTemplates}
                  onLoadMore={handleLoadMoreTemplates}
                  isPreview
                  onShowAll={handleShowAllGoals}
                />
              )}

              {activeTab === 'activity' && (
                <ActivityTab
                  activities={activities.slice(0, 4)}
                  isLoading={isLoadingActivity}
                  onReact={handleReact}
                  onComment={handleComment}
                  reactingActivityId={reactingActivityId}
                  hasNextPage={hasNextActivity}
                  onLoadMore={handleLoadMoreActivity}
                  isPreview
                  onShowAll={handleShowAllActivity}
                />
              )}

              {activeTab === 'members' && (
                <MembersTab
                  members={members.slice(0, 4)}
                  isLoading={isLoadingMembers}
                  currentUserRole={userRole}
                  hasNextPage={hasNextMembers}
                  onLoadMore={handleLoadMoreMembers}
                  isPreview
                  onShowAll={handleShowAllMembers}
                />
              )}

              {activeTab === 'moderation' && isOwner && <ModerationTab />}
            </View>
          </View>
        </NoiseComponent>
      </PullToRefresh>
    </View>
  )
}
