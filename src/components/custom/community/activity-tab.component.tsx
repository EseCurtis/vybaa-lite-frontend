import { EmptyList } from '@/components/common/empty-list.component'
import { Spinner } from '@/components/common/spinner.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { ActivityItem } from '@/components/custom/community/activity-item.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityActivity } from '@/shared/api/community.api'
import { RiTimeLine } from '@remixicon/react'

interface ActivityTabProps {
  activities: CommunityActivity[]
  isLoading: boolean
  onReact: (activityId: string) => void
  onComment: (activityId: string) => void
  reactingActivityId?: string | null
  hasNextPage?: boolean
  onLoadMore?: () => void
  isPreview?: boolean
  onShowAll?: () => void
}

export function ActivityTab({
  activities,
  isLoading,
  onReact,
  onComment,
  reactingActivityId,
  hasNextPage,
  onLoadMore,
  isPreview,
  onShowAll,
}: ActivityTabProps) {
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Spinner />
      </View>
    )
  }

  if (activities.length === 0) {
    return (
      <EmptyList
        icon={<RiTimeLine size={48} className="text-white/40" />}
        title="No activity yet"
        description="Activity from community members will appear here."
      />
    )
  }

  // Preview mode on community page: simple list (no virtualization)
  if (isPreview) {
    return (
      <View className="py-4 space-y-3">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onReact={onReact}
            onComment={onComment}
            isReacting={reactingActivityId === activity.id}
          />
        ))}
        {onShowAll && (
          <View className="mt-2">
            <Pressable
              onPress={onShowAll}
              className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
            >
              <Text className="whitespace-nowrap text-sm">
                Show all activity
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  // Full page: keep virtualization
  return (
    <View className=" h-full overflow-hidden">
      <VirtualList
        items={activities}
        estimateSize={120}
       
        renderItem={(activity) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onReact={onReact}
            onComment={onComment}
            isReacting={reactingActivityId === activity.id}
          />
        )}
        footer={
          hasNextPage ? (
            <View className="mt-4 mb-2">
              <Pressable
                onPress={onLoadMore}
                className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
              >
                <Text className="whitespace-nowrap text-sm">Load more</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  )
}
