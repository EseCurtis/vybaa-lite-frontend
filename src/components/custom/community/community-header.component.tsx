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
    <View className="px-mg pb-4 gap-3">
      <View className="flex-row gap-3 items-center">
        <View className="">
          {community.coverImage && (
            <View className="h-36 aspect-square rounded-2xl mb-4 overflow-hidden">
              <img
                src={community.coverImage}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </View>
          )}
        </View>

        <View className="">
          {community.category && (
            <View className="flex-row">
              <View
                style={{
                  background: seedColorOpaque,
                }}
                className="flex items-center  px-2 py-1 rounded-full bg-card-lighter "
              >
                <Text
                  style={{
                    color: seedColor,
                  }}
                  className="text-white/60 font-bold text-[9px] font-bbh"
                >
                  {community.category}
                </Text>
              </View>
            </View>
          )}
          <View className="flex-row items-start justify-between ">
            <View className="flex-1 flex-row items-center gap-3">
              <Text className="text-white text-2xl font-bold font-bbh ">
                {community.name}
              </Text>
            </View>
          </View>

          {community.description && (
            <Text className="text-card-lighter-2 text-sm font-bbh mb-2 leading-relaxed">
              {community.description}
            </Text>
          )}

          {/* Stats */}
          {stats && (
            <View className="flex-row gap-4 ">
              <View className="flex-row items-center gap-1.5">
                <RiGroupLine size={16} className="text-card-lighter-2" />
                <Text className="text-card-lighter-2 text-xs font-bbh">
                  {stats.memberCount}{' '}
                  {/* {stats.memberCount === 1 ? 'member' : 'members'} */}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <RiFileList3Line size={16} className="text-card-lighter-2" />
                <Text className="text-card-lighter-2 text-xs font-bbh">
                  {stats.templateCount}{' '}
                  {/* {stats.templateCount === 1 ? 'template' : 'templates'} */}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <RiTimeLine size={16} className="text-card-lighter-2" />
                <Text className="text-card-lighter-2 text-xs font-bbh">
                  {stats.activeGoalCount}{' '}
                  {/* {stats.activeGoalCount === 1 ? 'goal' : 'goals'} */}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}
