import { EmptyList } from '@/components/common/empty-list.component'
import { BottomNotchPadd } from '@/components/common/notch.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { ActivityItem } from '@/components/custom/community/activity-item.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityActivity } from '@/shared/api/community.api'
import { Dimensions } from '@/shared/utils/dimensions.util'
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
      <View className="gap-3 p-4">
        {[1, 2, 3].map((item) => (
          <View key={item} className="gap-3 rounded-2xl bg-cardx p-4">
            <View className="flex-row items-center gap-3">
              <Skeleton className="size-10" rounded="full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-3 w-2/3" rounded="sm" />
                <Skeleton className="h-3 w-1/3" rounded="sm" />
              </View>
            </View>
            <Skeleton className="h-4 w-full" rounded="sm" />
          </View>
        ))}
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
    <View className=" h-full pl-05-mg overflow-hidden">
      <VirtualList
        items={activities}
        estimateSize={120}
        header={<View className="pt-7" />}
        renderItem={(activity, index) => (
          <ActivityItem
            key={activity.id}
            activity={activity}
            onReact={onReact}
            onComment={onComment}
            isReacting={reactingActivityId === activity.id}
            isLastItem={!!(index == activities.length - 1)}
          />
        )}
        footer={
          <View className="pb-[120px]">
            {hasNextPage ? (
              <View className="mt-4 mb-2">
                <Pressable
                  onPress={onLoadMore}
                  className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
                >
                  <Text className="whitespace-nowrap text-sm">Load more</Text>
                </Pressable>
              </View>
            ) : null}

            <BottomNotchPadd />
          </View>
        }
        height={Dimensions.screenHeight}
      />
    </View>
  )
}
