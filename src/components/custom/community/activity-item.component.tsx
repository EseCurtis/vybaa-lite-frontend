import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityActivity } from '@/shared/api/community.api'
import { RiChat3Line, RiFileAddLine, RiFireLine, RiHeartFill, RiHeartLine, RiTrophyLine } from '@remixicon/react'
import moment from 'moment'

interface ActivityItemProps {
  activity: CommunityActivity
  onReact?: (activityId: string) => void
  onComment?: (activityId: string) => void
  isReacting?: boolean
}

const activityIcons = {
  GOAL_STARTED: RiFireLine,
  GOAL_CHECK_IN: RiFireLine,
  GOAL_COMPLETED: RiTrophyLine,
  ACHIEVEMENT_EARNED: RiTrophyLine,
  TEMPLATE_CREATED: RiFileAddLine,
}

const activityLabels = {
  GOAL_STARTED: 'started a goal',
  GOAL_CHECK_IN: 'checked in',
  GOAL_COMPLETED: 'completed a goal',
  ACHIEVEMENT_EARNED: 'earned an achievement',
  TEMPLATE_CREATED: 'created a template',
}

export function ActivityItem({ activity, onReact, onComment, isReacting }: ActivityItemProps) {
  const Icon = activityIcons[activity.type] || RiFireLine
  const label = activityLabels[activity.type] || 'did something'

  const handleReact = (e: any) => {
    e.stopPropagation()
    onReact?.(activity.id)
  }

  const handleComment = (e: any) => {
    e.stopPropagation()
    onComment?.(activity.id)
  }

  return (
    <View className="p-4 rounded-2xl bg-card-light mb-3">
      <View className="flex-row items-start gap-3 mb-3">
        <View className="w-10 h-10 rounded-full bg-card-lighter flex items-center justify-center shrink-0">
          {activity.user.avatarUrl ? (
            <img
              src={activity.user.avatarUrl}
              alt={activity.user.username || 'User'}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <Text className="text-white/60 text-sm font-bold font-bbh">
              {(activity.user.username || activity.user.firstName || 'U')[0].toUpperCase()}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Text className="text-white text-sm font-bold font-bbh">
              {activity.user.username || activity.user.firstName || 'User'}
            </Text>
            <Icon size={14} className="text-white/40" />
            <Text className="text-white/60 text-sm font-bbh">
              {label}
            </Text>
          </View>
          <Text className="text-white/40 text-xs font-bbh">
            {moment(activity.createdAt).fromNow()}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-4 mt-3">
        <Pressable
          onPress={handleReact}
          disabled={isReacting}
          className="flex-row items-center gap-1.5"
        >
          {activity.hasUserReacted ? (
            <RiHeartFill size={18} className="text-accent-500" />
          ) : (
            <RiHeartLine size={18} className="text-white/40" />
          )}
          <Text className={`text-sm font-bbh ${activity.hasUserReacted ? 'text-accent-500' : 'text-white/60'}`}>
            {activity._count?.reactions || 0}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleComment}
          className="flex-row items-center gap-1.5"
        >
          <RiChat3Line size={18} className="text-white/40" />
          <Text className="text-white/60 text-sm font-bbh">
            {activity._count?.comments || 0}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
