import { EmptyList } from '@/components/common/empty-list.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { VirtualList } from '@/components/common/virtual-list.component'
import { MemberCard } from '@/components/custom/community/member-card.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityMember } from '@/shared/api/community.api'
import { RiGroupLine } from '@remixicon/react'

interface MembersTabProps {
  members: CommunityMember[]
  isLoading: boolean
  currentUserRole?: 'OWNER' | 'MOD' | 'MEMBER' | null
  hasNextPage?: boolean
  onLoadMore?: () => void
  isPreview?: boolean
  onShowAll?: () => void
}

export function MembersTab({
  members,
  isLoading,
  currentUserRole,
  hasNextPage,
  onLoadMore,
  isPreview,
  onShowAll,
}: MembersTabProps) {
  if (isLoading) {
    return (
      <View className="gap-3 p-4">
        {[1, 2, 3, 4].map((item) => (
          <View
            key={item}
            className="flex-row items-center gap-3 rounded-2xl bg-cardx p-4"
          >
            <Skeleton className="size-11" rounded="full" />
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-1/2" rounded="sm" />
              <Skeleton className="h-3 w-1/3" rounded="sm" />
            </View>
          </View>
        ))}
      </View>
    )
  }

  if (members.length === 0) {
    return (
      <EmptyList
        icon={<RiGroupLine size={48} className="text-white/40" />}
        title="No members yet"
        description="Members will appear here once they join."
      />
    )
  }

  // Preview mode on community page: simple list (no virtualization)
  if (isPreview) {
    return (
      <View className="py-4 space-y-3">
        {members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            currentUserRole={currentUserRole}
          />
        ))}
        {onShowAll && (
          <View className="mt-2">
            <Pressable
              onPress={onShowAll}
              className="snap-center ml-2 text-card-lighter-3 bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-7 mx-auto py-3 font-bold"
            >
              <Text className="whitespace-nowrap text-sm">
                Show all members
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    )
  }

  // Full page: keep virtualization
  return (
    <View className="py-4">
      <VirtualList
        items={members}
        estimateSize={96}
        height={520}
        renderItem={(member) => (
          <MemberCard
            key={member.id}
            member={member}
            currentUserRole={currentUserRole}
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
