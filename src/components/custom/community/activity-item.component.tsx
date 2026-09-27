import { ContentSafetySheet } from '@/components/custom/community/content-safety-sheet.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { CommunityActivity } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { formatCompactNumber } from '@/shared/utils/number-format.util'
import {
  RiChat3Line,
  RiDoorOpenLine,
  RiErrorWarningLine,
  RiFileAddLine,
  RiFireLine,
  RiHeartFill,
  RiHeartLine,
  RiIndeterminateCircleLine,
  RiMore2Line,
  RiTrophyLine,
  type RemixiconComponentType,
} from '@remixicon/react'
import moment from 'moment'

interface ActivityItemProps {
  activity: CommunityActivity
  onReact?: (activityId: string) => void
  onComment?: (activityId: string) => void
  isReacting?: boolean
  isLastItem?: boolean
  communityId?: string
}

const activityIcons: Record<CommunityActivity['type'], RemixiconComponentType> =
  {
    GOAL_STARTED: RiFireLine,
    GOAL_CHECK_IN: RiFireLine,
    GOAL_COMPLETED: RiTrophyLine,
    GOAL_DELETED: RiIndeterminateCircleLine,
    MEMBER_LEFT: RiDoorOpenLine,
    ACHIEVEMENT_EARNED: RiTrophyLine,
    TEMPLATE_CREATED: RiFileAddLine,
    GOAL_STREAK_RESET: RiErrorWarningLine,
    MILESTONE_REACHED: RiTrophyLine,
  }

const activityLabels = {
  GOAL_STREAK_RESET: 'lost a streak',
  GOAL_STARTED: 'started a goal',
  GOAL_CHECK_IN: 'checked in',
  GOAL_COMPLETED: 'completed a goal',
  ACHIEVEMENT_EARNED: 'earned an achievement',
  TEMPLATE_CREATED: 'created a template',
  GOAL_DELETED: 'deleted a goal',
  MEMBER_LEFT: 'left the community',
  MILESTONE_REACHED: 'reached a milestone',
}

export function ActivityItem({
  activity,
  onReact,
  onComment,
  isReacting,
  isLastItem,
  communityId,
}: ActivityItemProps) {
  const Icon = activityIcons[activity.type]
  const baseLabel = activityLabels[activity.type] || activity.type

  let goalOrTemplateLabel: string | null = null
  let milestonePointsLabel: string | null = null
  if (activity.metadata) {
    try {
      const meta = JSON.parse(activity.metadata)
      goalOrTemplateLabel =
        meta.goalText ||
        meta.templateTitle ||
        meta.title ||
        meta.milestoneName ||
        null

      if (
        activity.type === 'MILESTONE_REACHED' &&
        typeof meta.points === 'number'
      ) {
        milestonePointsLabel = `(+${meta.points} pts)`
      }
    } catch {
      goalOrTemplateLabel = null
    }
  }

  let label = baseLabel
  if (goalOrTemplateLabel) {
    label = `${label} - ${goalOrTemplateLabel}`
  }
  if (milestonePointsLabel) {
    label = `${label} ${milestonePointsLabel}`
  }

  const handleReact = () => {
    // e.stopPropagation()

    onReact?.(activity.id)
  }

  const handleComment = () => {
    onComment?.(activity.id)
  }

  const seedColor = seededColor(activity.type)
  const { user } = useAuth()
  const bottomSheet = useBottomSheetController()
  const isOwnActivity = user?.id === activity.userId

  const openModerationActions = () => {
    bottomSheet.present(
      <ContentSafetySheet
        communityId={communityId}
        onBlocked={bottomSheet.dismiss}
        onReported={bottomSheet.dismiss}
        targetId={activity.id}
        targetType="activity"
        targetUserId={activity.userId}
        username={activity.user.username || activity.user.firstName || 'user'}
      />,
      { title: 'Safety actions' },
    )
  }

  return (
    <View className="mb-1 rounded-2xl">
      <View className="flex-row items-start gap-3 mb-3">
        <View className="">
          <View className="w-12 h-12 rounded-full bg-card-lighter flex items-center justify-center shrink-0">
            {activity.user.avatarUrl ? (
              <img
                src={activity.user.avatarUrl}
                alt={activity.user.username || 'User'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <Text className="text-card-lighter-3/60 text-sm font-bold font-bbh">
                {(activity.user.username ||
                  activity.user.firstName ||
                  'U')[0].toUpperCase()}
              </Text>
            )}
          </View>
          {!isLastItem && (
            <View className="h-7 scale-y-[1.7] border-l border-dashed mx-auto mt-4 -translate-x-0.5 border-card-lighter-3/30 "></View>
          )}
        </View>

        <View className="flex-1">
          <View className="flex-col items-start gap-2 mb-1">
            <View className="flex-row gap-2 items-center">
              <Text className="text-white text-xs font-bold font-bbh">
                @{activity.user.username || activity.user.firstName || 'User'}
              </Text>
              <Icon
                size={14}
                color={seedColor}
                className="text-card-lighter-3/40"
              />
              <Text className="text-card-lighter-3/40 text-xs font-bbh">
                {moment(activity.createdAt).fromNow()}
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="flex-1 text-card-lighter-3/90 text-xs font-bbh">
                {label}
              </Text>
              {!isOwnActivity ? (
                <Pressable
                  accessibilityLabel={`Safety actions for ${activity.user.username || activity.user.firstName || 'user'}`}
                  className="size-11 items-center justify-center text-card-lighter-3"
                  onPress={openModerationActions}
                >
                  <RiMore2Line size={18} />
                </Pressable>
              ) : null}
            </View>
          </View>
          <View className="">
            <View className="flex-row justify-ensd items-center gap-4 mt-3">
              <Pressable
                onPress={() => {
                  handleReact()
                }}
                disabled={isReacting}
                className="flex-row  items-center gap-1.5 active:scale-95 transition-transform"
              >
                {activity.hasUserReacted ? (
                  <RiHeartFill size={18} className="text-accent-500" />
                ) : (
                  <RiHeartLine size={18} className="text-card-lighter-3/40" />
                )}
                <Text
                  className={`text-sm font-bbh ${activity.hasUserReacted ? 'text-accent-500' : 'text-card-lighter-3/60'}`}
                >
                  {formatCompactNumber(activity._count?.reactions)}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleComment}
                className="flex-row hidden items-center gap-1.5"
              >
                <RiChat3Line size={18} className="text-card-lighter-3/40" />
                <Text className="text-card-lighter-3/60 text-sm font-bbh">
                  {formatCompactNumber(activity._count?.comments)}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
