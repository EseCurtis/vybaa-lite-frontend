import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { PullToRefresh } from '@/components/common/pull-to-refresh.component'
import { Skeleton } from '@/components/common/skeleton.component'
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
import { Button } from '@/components/layout/button.component'
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
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { communityQueryKeys } from '@/shared/api/community.query-keys'
import { hapticFeedback } from '@/shared/haptic.util'
import { RiLockLine, RiMore2Fill, RiUserAddLine } from '@remixicon/react'
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
  const isMember = community?.isMember || false
  const userRole = community?.userRole
  const isOwner = userRole === 'OWNER'
  const canViewMemberContent = isMember
  const canJoinDirectly = community?.isPublic ?? false
  const { data: stats } = useCommunityStats(communityId, canViewMemberContent)
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    fetchNextPage: fetchNextTemplates,
    hasNextPage: hasNextTemplates,
  } = useTemplates(communityId, 20, canViewMemberContent)
  const {
    data: activityData,
    isLoading: isLoadingActivity,
    fetchNextPage: fetchNextActivity,
    hasNextPage: hasNextActivity,
  } = useActivityFeed(communityId, 20, canViewMemberContent)
  const {
    data: membersData,
    isLoading: isLoadingMembers,
    fetchNextPage: fetchNextMembers,
    hasNextPage: hasNextMembers,
  } = useCommunityMembers(communityId, 50, canViewMemberContent)
  const { mutateAsync: joinCommunity, isPending: isJoiningCommunity } =
    useJoinCommunity()
  const { mutateAsync: leaveCommunity } = useLeaveCommunity()
  const { mutateAsync: startGoal, isPending: isStartingGoal } =
    useStartGoalFromTemplate()
  const { handleSubscriptionError } = useProAccess()
  const { mutateAsync: reactToActivity } = useReactToActivity(communityId)
  const templates = templatesData?.pages.flatMap((page) => page.data) || []
  const activities = activityData?.pages.flatMap((page) => page.data) || []
  const members = membersData?.pages.flatMap((page) => page.data) || []
  const activeTab = isMember
    ? getCommunityTabFromHash(locationHash, isOwner)
    : defaultCommunityTab

  useEffect(() => {
    const normalizedTab = isMember
      ? getCommunityTabFromHash(locationHash, isOwner)
      : defaultCommunityTab
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
  }, [communityId, isMember, isOwner, locationHash, navigate])

  useEffect(() => {
    hapticFeedback.light()
  }, [activeTab])

  const handleJoin = async () => {
    if (!canJoinDirectly) {
      return
    }

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
        canJoinDirectly={canJoinDirectly}
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
          const startTemplateGoal = async (): Promise<void> => {
            await startGoal({ templateId: template.id })
            bottomSheet.dismiss()
            router.navigate({ to: '/app/goal' })
          }

          try {
            await startTemplateGoal()
          } catch (error) {
            const handled = await handleSubscriptionError(
              error,
              startTemplateGoal,
            )
            if (handled) return
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

  const handleComment = () => {}

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
          <View className="gap-4 px-mg py-5">
            <Skeleton className="h-48 w-full" rounded="xl" />
            <Skeleton className="h-8 w-2/3" rounded="sm" />
            <Skeleton className="h-28 w-full" rounded="xl" />
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

  const displayStats = stats ?? {
    activeGoalCount: community._count?.goals ?? 0,
    memberCount: community._count?.members ?? 0,
    recentActivityCount: 0,
    templateCount: community._count?.templates ?? 0,
  }

  return (
    <View className="flex-1 bg-cardd">
      <View className="absolute top-0 left-0 w-full z-[999] backdrop-blur-xl bg-cardd/30">
        <TabHeader
          title={'Community'}
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
      <NoiseComponent>
        <PullToRefresh
          className="flex-1 overflow-y-auto no-scrollbar"
          onRefresh={handleRefreshCommunity}
          refreshing={isRefreshing}
        >
          <View className="z-10 relative ">
            <TopNotch />
            <View className="mt-24" />

            <CommunityHeader community={community} stats={displayStats} />

            {!isMember ? (
              <View className="px-mg pb-20">
                <View className="rounded-3xl bg-cardd/80 border border-card-light/30 p-5 gap-4">
                  <View className="flex-row items-start gap-3">
                    <View className="w-11 h-11 rounded-full bg-warning-yellow/15 items-center justify-center">
                      <RiLockLine size={20} className="text-warning-yellow" />
                    </View>
                    <View className="flex-1 min-w-0">
                      <Text className="text-white text-base font-bold font-bbh">
                        Join to unlock the room
                      </Text>
                      <Text className="text-card-lighter-2 text-sm font-bbh mt-1 leading-relaxed">
                        Preview the community here. Members can start shared
                        goals, see activity, react, and meet the people inside.
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <View className="flex-1 rounded-2xl bg-card-light/20 p-3">
                      <Text className="text-white text-lg font-bold font-bbh">
                        {displayStats.templateCount}
                      </Text>
                      <Text className="text-card-lighter-2 text-xs font-bbh">
                        templates
                      </Text>
                    </View>
                    <View className="flex-1 rounded-2xl bg-card-light/20 p-3">
                      <Text className="text-white text-lg font-bold font-bbh">
                        {displayStats.activeGoalCount}
                      </Text>
                      <Text className="text-card-lighter-2 text-xs font-bbh">
                        active goals
                      </Text>
                    </View>
                  </View>

                  <Button
                    label={
                      canJoinDirectly ? 'Join community' : 'Invite required'
                    }
                    variant="default"
                    fullWidth
                    onClick={handleJoin}
                    loading={isJoiningCommunity}
                    disabled={isJoiningCommunity || !canJoinDirectly}
                    leftIcon={<RiUserAddLine size={18} />}
                  />
                </View>
              </View>
            ) : (
              <>
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
                      communityId={communityId}
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
              </>
            )}
          </View>
        </PullToRefresh>
      </NoiseComponent>
    </View>
  )
}
