import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Community } from '@/shared/api/community.api'
import { RiFileList3Line, RiFireLine, RiGroupLine } from '@remixicon/react'

interface CommunityCardProps {
  community: Community
  onPress?: (community: Community) => void
}

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  const handlePress = () => {
    onPress?.(community)
  }

  return (
    <Pressable
      onPress={handlePress}
      className="p-4 rounded-2xl bg-card-light/40 border border-card-lighter/20 mb-3"
    >
      {community.coverImage && (
        <View className="w-full h-32 rounded-xl mb-3 overflow-hidden">
          <img
            src={community.coverImage}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        </View>
      )}

      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white text-lg font-bold font-bbh mb-1">
            {community.name}
          </Text>
          {community.description && (
            <Text className="text-white/60 text-sm font-bbh line-clamp-2">
              {community.description}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-3">
        <View className="flex-row items-center gap-1.5">
          <RiGroupLine size={16} className="text-white/40" />
          <Text className="text-white/60 text-xs font-bbh">
            {community._count?.members || 0} members
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <RiFileList3Line size={16} className="text-white/40" />
          <Text className="text-white/60 text-xs font-bbh">
            {community._count?.templates || 0} templates
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <RiFireLine size={16} className="text-white/40" />
          <Text className="text-white/60 text-xs font-bbh">
            {community._count?.goals || 0} active
          </Text>
        </View>
      </View>

      {community.category && (
        <View className="mt-2">
          <View className="inline-block px-2 py-1 rounded-full bg-card-lighter/20">
            <Text className="text-white/60 text-xs font-bbh">
              {community.category}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  )
}
