import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { TemplateParticipant } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiCheckLine, RiFireLine } from '@remixicon/react'
import moment from 'moment'

interface TemplateParticipantCardProps {
  participant: TemplateParticipant
  templateGoalText: string
}

export function TemplateParticipantCard({ participant, templateGoalText }: TemplateParticipantCardProps) {
  const bgColor = seededColor(templateGoalText)
  const displayName = participant.user.firstName && participant.user.lastName
    ? `${participant.user.firstName} ${participant.user.lastName}`
    : participant.user.username || 'Anonymous';

    

  return (
    <Pressable
      className="p-4 rounded-2xl bg-card-light/20 mb-3 w-full flex-col justify-between shrink-0"
    >
      <View className="flex-row items-center  gap-3 mb-3">
        <Avatar url={participant.user.avatarUrl!} />
        <View className="flex-1 justify-start text-left">
          <Text className="text-white text-sm font-bold font-bbh">
            {displayName}
          </Text>
          <Text className="text-white/60 text-xs font-bbh">
            Started {moment(participant.startedAt).fromNow()}
          </Text>
        </View>
        {participant.isCompleted && (
          <View
            className="p-2 rounded-full"
            style={{ backgroundColor: bgColor }}
          >
            <RiCheckLine size={16} className="text-black" />
          </View>
        )}
      </View>

      <View className="mb-2 mt-3 w-full">
        <View className="flex-row items-center justify-between mb-1 gap-3">
          <Text className="text-white/80 text-xs font-bbh">
            Day {participant.currentDay} of {participant.targetDays}
          </Text>
          <Text className="text-white/60 text-xs font-bbh">
            {participant.progress}%
          </Text>
        </View>
        <View className="h-2     w-full rounded-full bg-card-lighter overflow-hidden">
          <View
            className="h-full  w-full  rounded-full"
            style={{
              width: `${Math.min(participant.progress, 100)}%`,
              backgroundColor: bgColor,
            }}
          />
        </View>
      </View>

      {participant.lastCheckInDate && (
        <View className="flex-row items-center gap-1.5">
          <RiFireLine size={12} className="text-white/40" />
          <Text className="text-white/40 text-[10px] font-bbh">
            Last check-in: {moment(participant.lastCheckInDate).fromNow()}
          </Text>
        </View>
      )}
    </Pressable>
  )
}
