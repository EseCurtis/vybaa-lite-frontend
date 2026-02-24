import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { ActivityItem } from '@/components/custom/community/activity-item.component'
import { CreateTemplateSheet } from '@/components/custom/community/create-template-sheet.component'
import { MemberCard } from '@/components/custom/community/member-card.component'
import { StartGoalConfirmationSheet } from '@/components/custom/community/start-goal-confirmation-sheet.component'
import { TemplateCard } from '@/components/custom/community/template-card.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
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
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import {
  RiAddLine,
  RiFileList3Line,
  RiGroupLine,
  RiLogoutBoxLine,
  RiTimeLine,
} from '@remixicon/react'
import { useParams, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

type Tab = 'templates' | 'activity' | 'members'

export default function CommunityDetailScreen() {
  const router = useRouter()
  const { communityId } = useParams({ from: '/app/community/$communityId' })
  const bottomSheet = useBottomSheetController()
  const [activeTab, setActiveTab] = useState<Tab>('templates')

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const { data: stats } = useCommunityStats(communityId)
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates(
    communityId,
    1,
    20,
  )
  const { data: activityData, isLoading: isLoadingActivity } = useActivityFeed(
    communityId,
    1,
    20,
  )
  const { data: membersData, isLoading: isLoadingMembers } =
    useCommunityMembers(communityId, 1, 50)
  const { mutateAsync: joinCommunity } = useJoinCommunity()
  const { mutateAsync: leaveCommunity } = useLeaveCommunity()
  const { mutateAsync: createTemplate } = useCreateTemplate()
  const { mutateAsync: startGoal, isPending: isStartingGoal } =
    useStartGoalFromTemplate()
  const { mutateAsync: reactToActivity } = useReactToActivity()

  const templates = templatesData?.data || []
  const activities = activityData?.data || []
  const members = membersData?.data || []
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
      await reactToActivity(activityId)
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleComment = (activityId: string) => {
    // TODO: Implement comment sheet
    console.log('Comment on activity', activityId)
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

  const seedColor = seededColor(community.name)
  const seedColorOpaque = adjustColor(seedColor, {
    alpha: -0.7,
  })

  return (
    <View
    
      className="flex-1 bg-cardd overflow-y-auto relative"
    >
      <View   style={{
        //@ts-ignore
        '--theme-color': seedColor,
      }} className="absolute top-0 left-0 bg-gradient-to-br opacity-10 from-[var(--theme-color)] to-transparent bg-blend-multiply size-full"></View>
      <NoiseComponent>
        <TabHeader
          title={community.name}
          children={
            <View className="flex-row gap-2">
              {!isMember ? (
                <Button
                  label="Join"
                  variant="default"
                  onClick={handleJoin}
                  className="px-4 py-2"
                  textClassName="text-sm"
                />
              ) : userRole === 'OWNER' || userRole === 'MOD' ? (
                <Pressable
                  onPress={handleCreateTemplate}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <RiAddLine size={20} />
                </Pressable>
              ) : null}
              {isMember && userRole !== 'OWNER' && (
                <Pressable
                  onPress={handleLeave}
                  className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <RiLogoutBoxLine size={20} />
                </Pressable>
              )}
            </View>
          }
        />

        {/* Community Header */}
        <View className="px-mg pb-4">
          {community.coverImage && (
            <View className="w-full h-48 rounded-2xl mb-4 overflow-hidden">
              <img
                src={community.coverImage}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </View>
          )}

          <View className="mb-4">
            <View className="flex-row items-start justify-between mb-2">
              <View className="flex-1 flex-row items-center gap-3">
                <Text className="text-white text-2xl font-bold font-bbh mb-2">
                  {community.name}
                </Text>
                {community.category && (
                  <View
                    style={{
                      background: seedColorOpaque,
                    }}
                    className="inline-block px-2 py-0 rounded-full bg-card-lighter mb-2"
                  >
                    <Text className="text-white/60 text-xs font-bbh">
                      {community.category}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {community.description && (
              <Text className="text-white/60 text-sm font-bbh mb-4 leading-relaxed">
                {community.description}
              </Text>
            )}

            {/* Stats */}
            {stats && (
              <View className="flex-row gap-4 flex-wrap">
                <View className="flex-row items-center gap-1.5">
                  <RiGroupLine size={16} className="text-white/40" />
                  <Text className="text-white/60 text-xs font-bbh">
                    {stats.memberCount}{' '}
                    {stats.memberCount === 1 ? 'member' : 'members'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <RiFileList3Line size={16} className="text-white/40" />
                  <Text className="text-white/60 text-xs font-bbh">
                    {stats.templateCount}{' '}
                    {stats.templateCount === 1 ? 'template' : 'templates'}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <RiTimeLine size={16} className="text-white/40" />
                  <Text className="text-white/60 text-xs font-bbh">
                    {stats.activeGoalCount} active{' '}
                    {stats.activeGoalCount === 1 ? 'goal' : 'goals'}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View className="flex-row gap-3 mb-4 max-w-full overflow-x-auto no-scrollbar">
            {(['templates', 'activity', 'members'] as Tab[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-2',
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'bg-card-light/30 text-white',
                )}
              >
                <Text className="text-sm font-bold font-bbh capitalize">
                  {tab}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tab Content */}
        <View className="flex-1 px-mg pb-20">
          {activeTab === 'templates' && (
            <>
              {isLoadingTemplates ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner />
                </View>
              ) : templates.length === 0 ? (
                <EmptyList
                  icon={<RiFileList3Line size={48} className="text-white/40" />}
                  title="No templates yet"
                  description={
                    isMember && (userRole === 'OWNER' || userRole === 'MOD')
                      ? 'Create the first template for this community!'
                      : 'No templates have been created yet.'
                  }
                  action={
                    isMember && (userRole === 'OWNER' || userRole === 'MOD')
                      ? {
                          label: 'Create Template',
                          onPress: handleCreateTemplate,
                        }
                      : undefined
                  }
                />
              ) : (
                <View className="py-4">
                  {templates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onPress={(template) => {
                        router.navigate({
                          to: `/app/communities/templates/${template.id}`,
                        })
                      }}
                      onStart={handleStartGoal}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <>
              {isLoadingActivity ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner />
                </View>
              ) : activities.length === 0 ? (
                <EmptyList
                  icon={<RiTimeLine size={48} className="text-white/40" />}
                  title="No activity yet"
                  description="Activity from community members will appear here."
                />
              ) : (
                <View className="py-4">
                  {activities.map((activity) => (
                    <ActivityItem
                      key={activity.id}
                      activity={activity}
                      onReact={handleReact}
                      onComment={handleComment}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === 'members' && (
            <>
              {isLoadingMembers ? (
                <View className="flex-1 items-center justify-center">
                  <Spinner />
                </View>
              ) : members.length === 0 ? (
                <EmptyList
                  icon={<RiGroupLine size={48} className="text-white/40" />}
                  title="No members yet"
                  description="Members will appear here once they join."
                />
              ) : (
                <View className="py-4">
                  {members.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      currentUserRole={userRole}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
