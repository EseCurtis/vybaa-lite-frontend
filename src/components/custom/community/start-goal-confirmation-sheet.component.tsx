import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { GoalTemplate } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiCalendarLine, RiUserLine } from '@remixicon/react'

interface StartGoalConfirmationSheetProps {
  template: GoalTemplate
  onConfirm: () => void
  onCancel: () => void
  isStarting?: boolean
}

const formatParticipantsCount = (count: number): string => {
  if (count < 10) return `${count}`
  if (count < 100) return `${Math.floor(count / 10) * 10}+`
  if (count < 1000) return `${Math.floor(count / 100) * 100}+`
  if (count < 1000000) return `${Math.floor(count / 1000)}k+`
  return `${Math.floor(count / 1000000)}m+`
}

export function StartGoalConfirmationSheet({
  template,
  onConfirm,
  onCancel,
  isStarting = false,
}: StartGoalConfirmationSheetProps) {
  const bgColor = seededColor(template.goalText)
  const participants = template._count?.startedGoals || 0

  return (
    <View className="space-y-6">
      <View className="space-y-4">
        <Text className="text-white hidden text-lg font-bold font-bbh text-center">
          Start this goal?
        </Text>
        
        <View
          className="p-4 rounded-2xl"
          style={{ backgroundColor: bgColor }}
        >
          <Text className="text-black text-base font-bold font-bbh mb-3">
            {template.goalText}
          </Text>
          
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1.5">
              <RiCalendarLine size={16} className="text-black/60" />
              <Text className="text-black/70 text-xs font-bbh">
                {template.targetDays} days
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <RiUserLine size={16} className="text-black/60" />
              <Text className="text-black/70 text-xs font-bbh">
                {formatParticipantsCount(participants)} sharing
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-white/60 text-sm font-bbh text-center">
          This goal will be added to your personal goals and you'll be able to check in daily.
        </Text>
      </View>

      <View className="flex-row gap-3 items-center justify-center">
        <Button
          label="Copy this Goal"
          variant="default"
          onClick={onConfirm}
          disabled={isStarting}
          loading={isStarting}
            fullWidth
          textClassName="text-sm"
        />
      </View>
    </View>
  )
}
