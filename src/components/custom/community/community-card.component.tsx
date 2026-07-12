import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { Community } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiArrowRightUpLine, RiFileList3Line, RiFireFill, RiGroupLine } from '@remixicon/react'

interface CommunityCardProps {
  community: Community
  onPress?: (community: Community) => void
}

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  const handlePress = () => {
    onPress?.(community)
  }

  const bgColor = seededColor(community.name)
  const patternColor = seededColor(`${community.id}-${community.name}`)

  return (
    <Pressable
      onPress={handlePress}
      className="p-3 flex-row gap-4 rounded-3xl mb-3 w-full shrink-0 relative transition-all"
    >
      <View className="relative size-[50px] shrink-0 inline-block">
        <View
          className="rounded-3xl absolute right-0 bottom-0 border border-white"
          style={{ backgroundColor: bgColor }}
        >
          <Avatar url={community?.owner?.avatarUrl ?? undefined}/>
        </View>

        <View
          className="size-full rounded-full overflow-hidden"
          style={{
            backgroundColor: bgColor,
            backgroundImage: community.coverImage
              ? undefined
              : `linear-gradient(135deg, ${patternColor} 0 24%, transparent 24% 100%),
                 radial-gradient(circle at 72% 28%, rgba(255,255,255,0.45) 0 12%, transparent 13%),
                 repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 4px, transparent 4px 10px)`,
          }}
        >
          {community.coverImage ? (
            <img
              src={community.coverImage}
              alt={community.name}
              className="size-full object-cover"
            />
          ) : (
            <View className="size-full items-center justify-center">
              <Text className="text-white text-sm font-bbh font-bold">
                {community.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>
      <View className="flex flex-col gap-2 flex-1 min-w-0">
        <View className="flex text-left flex-row items-start justify-between gap-2">
          <View className="flex-1 min-w-0">
            <Text className="text-white text-base font-bold font-bbh mb-1 break-words">
              {community.name}
            </Text>
            {community.description && (
              <Text className="text-white/70 text-xs font-bbh line-clamp-2">
                {community.description}
              </Text>
            )}
          </View>
        </View>

        <View className="flex flex-row flex-wrap items-center justify-between mt-1 gap-3 min-w-0">
          <View className="flex flex-row flex-wrap items-center gap-3 min-w-0">
            <View className="flex flex whitespace-nowrap flex-row items-center gap-1.5">
              <RiGroupLine size={16} className="text-white/60" />
              <Text className="text-white/70 text-[11px] font-bbh">
                {community._count?.members || 0} members
              </Text>
            </View>
            <View className="flex flex whitespace-nowrap flex-row items-center gap-1.5">
              <RiFileList3Line size={16} className="text-white/60" />
              <Text className="text-white/70 text-[11px] font-bbh">
                {community._count?.templates || 0} templates
              </Text>
            </View>
          </View>

          <View className="px-3 pl-2 py-1 flex whitespace-nowrap rounded-full bg-warning-yellow/10 flex flex-row items-center gap-1">
            <RiFireFill size={14} className="text-warning-yellow/70" />
            <Text className="text-warning-yellow/80 text-[11px] font-bbh">
              {community._count?.goals || 0} active
            </Text>
          </View>
        </View>
      </View>
      <View className="p-2">
        <RiArrowRightUpLine className='text-card-lighter-3'/>
      </View>
    </Pressable>
  )
}
