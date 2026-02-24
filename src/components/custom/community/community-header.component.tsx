import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Community, CommunityStats } from '@/shared/api/community.api'
import { adjustColor, seededColor } from '@/shared/utils/helpers.util'
import { RiFileList3Line, RiGroupLine, RiTimeLine } from '@remixicon/react'

interface CommunityHeaderProps {
  community: Community
  stats?: CommunityStats
}

export function CommunityHeader({ community, stats }: CommunityHeaderProps) {
  const seedColor = seededColor(community.name)
  const seedColorOpaque = adjustColor(seedColor, {
    alpha: -0.7,
  })

  return (
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
    </View>
  )
}
