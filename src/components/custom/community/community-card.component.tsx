import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { Community } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiArrowRightUpLine, RiGroupLine, RiTargetLine } from '@remixicon/react'
import type { MouseEvent } from 'react'

import { FlameIcon } from 'lucide-react'
import { CommunityIllustration } from './community-illustration.component'

interface CommunityCardProps {
  community: Community
  isJoining?: boolean
  onJoin?: (community: Community) => void
  onPress?: (community: Community) => void
  showDiscoverySignal?: boolean
}

export function CommunityCard({
  community,
  isJoining,
  onJoin,
  onPress,
  showDiscoverySignal,
}: CommunityCardProps) {
  const handlePress = () => {
    onPress?.(community)
  }

  const handleJoin = (event: MouseEvent) => {
    event.stopPropagation()
    onJoin?.(community)
  }

  const bgColor = seededColor(community.name)
  const membershipLabel =
    community.userRole === 'OWNER'
      ? 'Owner'
      : community.isMember
        ? 'Joined'
        : community.discoveryReason || 'Preview'

  return (
    <Pressable
      onPress={handlePress}
      className="p-3 flex-row gap-4 rounded-3xl mb-3 w-full shrink-0 relative transition-all"
    >
      <View className="relative size-[50px] shrink-0 inline-block">
        {community?.owner && (
          <View
            className="rounded-3xl  z-10 absolute right-0 translate-x-[5px] -bottom-[5px] border-2 border-black"
            style={{ backgroundColor: bgColor }}
          >
            <Avatar user={community?.owner as any} url={community?.owner?.avatarUrl ?? undefined} />
          </View>
        )}

        <View className="size-full rounded-xl overflow-hidden">
          <CommunityIllustration
            className="size-full "
            label={community.name}
            seed={`${community.id}-${community.name}`}
            showInitials
            value={community.coverImage}
          />
        </View>
      </View>
      <View className="flex flex-col gap-2 flex-1 min-w-0">
        <View className="flex text-left flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <Text
              lines={1}
              className="text-white text-sm text-base font-bold font-bbh mb-1 break-words"
            >
              {community.name}
            </Text>
            {community.description && (
              <Text
                lines={2}
                className="text-white/70 text-xs font-bbh line-clamp-2"
              >
                {community.description}
              </Text>
            )}
          </View>
        </View>

        <View className="flex flex-row flex-wrap items-center justify-between mt-1 gap-3 min-w-0">
          <View className="flex flex-row flex-wrap items-center gap-3 min-w-0">
            <View className="flex whitespace-nowrap flex-row items-center gap-1.5">
              <RiGroupLine size={16} className="text-blue-400" />
              <Text className="text-white/70 text-[11px] font-bbh">
                {community._count?.members || 0}
              </Text>
            </View>
            <View className="flex whitespace-nowrap flex-row items-center gap-1.5">
              <RiTargetLine size={16} className="text-accent-400" />
              <Text className="text-white/70 text-[11px] font-bbh">
                {community._count?.templates || 0}
              </Text>
            </View>

            <View className="flex flex whitespace-nowrap flex-row items-center gap-1.5">
              <FlameIcon size={16} className="text-warning-yellow" />
              <Text className="text-white/70 text-[11px] font-bbh">
                {community._count?.goals || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className="p-2 items-end justify-start">
        {!community.isMember && onJoin ? (
          <Button
            label="Join"
            variant="default"
            onClick={handleJoin}
            loading={isJoining}
            disabled={isJoining}
            className="px-4 py-2 min-w-[72px]"
            textClassName="text-xs"
            size="sm"
          />
        ) : (
          <RiArrowRightUpLine className="text-card-lighter-3" />
        )}
      </View>
    </Pressable>
  )
}
