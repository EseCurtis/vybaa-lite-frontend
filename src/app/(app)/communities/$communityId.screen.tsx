import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ActivityTab } from '@/components/custom/community/activity-tab.component'
import { CommunityBackground } from '@/components/custom/community/community-background.component'
import { CommunityHeaderActions } from '@/components/custom/community/community-header-actions.component'
import { CommunityHeader } from '@/components/custom/community/community-header.component'
import { CommunityTabs } from '@/components/custom/community/community-tabs.component'
import { CreateTemplateSheet } from '@/components/custom/community/create-template-sheet.component'
import { MembersTab } from '@/components/custom/community/members-tab.component'
import { StartGoalConfirmationSheet } from '@/components/custom/community/start-goal-confirmation-sheet.component'
import { TemplatesTab } from '@/components/custom/community/templates-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useActivityFeed,
  useCommunity,
  useCommunityMembers,
  useCommunityStats,
  useCreateTemplate,
  useJoinCommunity,
  useLeaveCommunity,
  useReactToActivity,
  useStartGoalFromTemplate,
  useTemplates,
} from '@/hooks/use-communities.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

type Tab = 'templates' | 'activity' | 'members'

export default function CommunityDetailScreen() {
  const router = useRouter()
  const { communityId } = useParams({ from: '/app/community/$communityId' })
  const bottomSheet = useBottomSheetController()
  const [activeTab, setActiveTab] = useState<Tab>('templates')
  const [templatesPage, setTemplatesPage] = useState(1)
  const [activityPage, setActivityPage] = useState(1)
  const [membersPage, setMembersPage] = useState(1)
  const [reactingActivityId, setReactingActivityId] = useState<string | null>(
    null,
  )

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const { data: stats } = useCommunityStats(communityId)
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates(
    communityId,
    templatesPage,
    20,
  )
  const { data: activityData, isLoading: isLoadingActivity } = useActivityFeed(
    communityId,
    activityPage,
    20,
  )
  const { data: membersData, isLoading: isLoadingMembers } =
    useCommunityMembers(communityId, membersPage, 50)
  const { mutateAsync: joinCommunity } = useJoinCommunity()
  const { mutateAsync: leaveCommunity } = useLeaveCommunity()
  const { mutateAsync: createTemplate } = useCreateTemplate()
  const { mutateAsync: startGoal, isPending: isStartingGoal } =
    useStartGoalFromTemplate()
  const { mutateAsync: reactToActivity } = useReactToActivity(communityId)

  const templates = templatesData?.data || []
  const templatesPagination = templatesData?.pagination
  const activities = activityData?.data || []
  const activityPagination = activityData?.pagination
  const members = membersData?.data || []
  const membersPagination = membersData?.pagination
  const isMember = community?.isMember || false
  const userRole = community?.userRole

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
    if (templatesPagination?.hasNextPage) {
      setTemplatesPage((prev) => prev + 1)
    }
  }

  const handleLoadMoreActivity = () => {
    if (activityPagination?.hasNextPage) {
      setActivityPage((prev) => prev + 1)
    }
  }

  const handleLoadMoreMembers = () => {
    if (membersPagination?.hasNextPage) {
      setMembersPage((prev) => prev + 1)
    }
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
    <View className="flex-1 bg-cardd overflow-y-auto ">
      <CommunityBackground communityName={community.name} />
      <NoiseComponent>
        <View className="z-10 relative">
          <TabHeader
            // title={community.name}
            children={
              <CommunityHeaderActions
                isMember={isMember}
                userRole={userRole}
                onJoin={handleJoin}
                onLeave={handleLeave}
                onCreateTemplate={handleCreateTemplate}
              />
            }
          />

          <CommunityHeader community={community} stats={stats} />

          <View className="px-mg">
            <CommunityTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </View>

          <View className="flex-1 px-mg pb-20">
            {activeTab === 'templates' && (
              <TemplatesTab
                templates={templates}
                isLoading={isLoadingTemplates}
                isMember={isMember}
                userRole={userRole}
                onCreateTemplate={handleCreateTemplate}
                onStartGoal={handleStartGoal}
                hasNextPage={templatesPagination?.hasNextPage}
                onLoadMore={handleLoadMoreTemplates}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityTab
                activities={activities}
                isLoading={isLoadingActivity}
                onReact={handleReact}
                onComment={handleComment}
                reactingActivityId={reactingActivityId}
                hasNextPage={activityPagination?.hasNextPage}
                onLoadMore={handleLoadMoreActivity}
              />
            )}

            {activeTab === 'members' && (
              <MembersTab
                members={members}
                isLoading={isLoadingMembers}
                currentUserRole={userRole}
                hasNextPage={membersPagination?.hasNextPage}
                onLoadMore={handleLoadMoreMembers}
              />
            )}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
