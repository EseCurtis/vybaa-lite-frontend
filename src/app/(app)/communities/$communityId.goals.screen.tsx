import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { TemplatesTab } from '@/components/custom/community/templates-tab.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useCommunity,
  useStartGoalFromTemplate,
  useTemplates,
} from '@/hooks/use-communities.hook'
import { useParams, useRouter } from '@tanstack/react-router'

export default function CommunityGoalsScreen() {
  const router = useRouter()
  const { communityId } = useParams({ from: '/app/community/goals/$communityId' })

  const { data: community, isLoading: isLoadingCommunity } =
    useCommunity(communityId)
  const {
    data: templatesData,
    isLoading: isLoadingTemplates,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTemplates(communityId, 20)
  const { mutateAsync: startGoal, isPending: isStartingGoal } =
    useStartGoalFromTemplate()

  const templates = templatesData?.pages.flatMap((page) => page.data) || []

  const handleLoadMoreTemplates = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }

  const handleBack = () => {
    router.navigate({ to: `/app/community/${communityId}` })
  }

  const handleStartGoal = async (template: any) => {
    try {
      await startGoal({ templateId: template.id })
      router.navigate({ to: '/app/goal' })
    } catch {
      // errors handled in hook
    }
  }

  if (isLoadingCommunity) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader canGoBack title="Community goals" onBack={handleBack} />
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
          <TabHeader canGoBack title="Community goals" onBack={handleBack} />
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
        <TabHeader canGoBack title="Community goals" onBack={handleBack} />
        <View className="flex-1 px-mg  ">
          <TemplatesTab
            templates={templates}
            isLoading={isLoadingTemplates || isFetchingNextPage}
            isMember={community.isMember || false}
            userRole={community.userRole}
            onCreateTemplate={() => {}}
            onStartGoal={handleStartGoal}
            hasNextPage={hasNextPage}
            onLoadMore={handleLoadMoreTemplates}
          />
        </View>
      </NoiseComponent>
    </View>
  )
}

