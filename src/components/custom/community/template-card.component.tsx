import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import type { GoalTemplate } from '@/shared/api/community.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiCalendarLine, RiUserLine } from '@remixicon/react'

interface TemplateCardProps {
  template: GoalTemplate
  onPress?: (template: GoalTemplate) => void
  onStart?: (template: GoalTemplate) => void
  isStarting?: boolean
}

const formatParticipantsCount = (count: number): string => {
  if (count < 10) return `${count}`
  if (count < 100) return `${Math.floor(count / 10) * 10}+`
  if (count < 1000) return `${Math.floor(count / 100) * 100}+`
  if (count < 1000000) return `${Math.floor(count / 1000)}k+`
  return `${Math.floor(count / 1000000)}m+`
}

export function TemplateCard({ template, onPress, onStart, isStarting }: TemplateCardProps) {
  const { user } = useAuth()
  const handlePress = () => {
    onPress?.(template)
  }

  const handleStart = (e: any) => {
    e.stopPropagation()
    onStart?.(template)
  }

  const bgColor = seededColor(template.goalText)
  const participants = template._count?.startedGoals || 0
  const isOwnTemplate = user && template.creator?.id === user.id

  return (
    <Pressable
      onPress={handlePress}
      className="p-3 rounded-3xl mb-3 w-full shrink-0 relative transition-all"
      style={{ backgroundColor: bgColor }}
    >
      <View className="flex flex-col gap-2 w-full">
        <Text className="text-black text-left text-base font-bold font-bbh mb-1">
          {template.goalText}
        </Text>

        <View className="flex flex-row items-center justify-between mt-1">
          <View className="flex flex-row items-center gap-3">
            <View className="flex flex-row items-center gap-1.5">
              <RiCalendarLine size={16} className="text-black/60" />
              <Text className="text-black/70 text-[11px] font-bbh">
                {template.targetDays} days 
              </Text>
            </View>
            <View className="flex flex-row items-center gap-1.5">
              <RiUserLine size={16} className="text-black/60" />
              <Text className="text-black/70 text-[11px] font-bbh">
                {formatParticipantsCount(participants)} sharing
              </Text>
            </View>
          </View>

          {!isOwnTemplate && onStart && (
            <Button
              label="Start"
              variant="default"
              onClick={handleStart}
              disabled={isStarting}
              loading={isStarting}
              className="px-4 py-2 bg-black/10 border-0"
              textClassName="text-sm text-black font-bbh"
            />
          )}
        </View>
      </View>
    </Pressable>
  )
}
