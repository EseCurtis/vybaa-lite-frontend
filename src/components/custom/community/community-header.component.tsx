import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Community, CommunityStats } from '@/shared/api/community.api'
import { adjustColor, seededColor } from '@/shared/utils/helpers.util'
import { RiGroupLine } from '@remixicon/react'

import { Avatar } from '@/components/user/avatar.component'
import { FlameIcon, GoalIcon } from 'lucide-react'
import { CommunityIllustration } from './community-illustration.component'

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
        <View className="relative">
          <CommunityIllustration
            className="mb-4 h-36 aspect-square rounded-2xl"
            label={community.name}
            seed={`${community.id}-${community.name}`}
            value={community.coverImage}
          />

          {community.category && (
            <View className="flex-row absolute top-0 left-0 m-1">
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
          <View className="absolute bottom-mg  w-full left-0 p-1">
            <View onClick={() => {
              //open public
            }} className="bg-cardx drop-shadow-xl items-center gap-1 flex-row rounded-r-[70px] p-1 rounded-l-[70px]">
              <Avatar size={40} user={community?.owner as any}/>
              <Text className="text-card-lighter-2 text-xs">@{community?.owner?.username}</Text>

            </View>
          </View>
        </View>

        <View className="pb-7 ">
          <View className="flex-row items-start justify-between ">
            <View className="flex-1 flex-row items-center gap-3">
              <Text
                lines={2}
                className="text-white text-md font-bold font-bbh "
              >
                {community.name}
              </Text>
            </View>
          </View>

          {community.description && (
            <Text
              lines={3}
              className="text-card-lighter-2 text-xs font-bbh mb-2 leading-relaxed"
            >
              {community.description}
            </Text>
          )}

          {/* Stats */}
          {stats && (
            <View className="flex-row gap-3 ">
              <View className="flex-row items-center gap-1.5">
                <RiGroupLine size={16} className="text-blue-400" />
                <Text className="text-card-lighter-2 text-xs font-bbh">
                  {stats.memberCount}{' '}
                  {/* {stats.memberCount === 1 ? 'member' : 'members'} */}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <GoalIcon size={16} className="text-accent-400" />
                <Text className="text-card-lighter-2 text-xs font-bbh">
                  {stats.templateCount}{' '}
                  {/* {stats.templateCount === 1 ? 'template' : 'templates'} */}
                </Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <FlameIcon size={16} className="text-warning-yellow" />
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
