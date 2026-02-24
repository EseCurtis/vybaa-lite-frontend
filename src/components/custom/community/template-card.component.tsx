import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { GoalTemplate } from '@/shared/api/community.api'
import { RiCalendarLine, RiUserLine } from '@remixicon/react'

interface TemplateCardProps {
  template: GoalTemplate
  onPress?: (template: GoalTemplate) => void
  onStart?: (template: GoalTemplate) => void
  isStarting?: boolean
}

export function TemplateCard({ template, onPress, onStart, isStarting }: TemplateCardProps) {
  const handlePress = () => {
    onPress?.(template)
  }

  const handleStart = (e: any) => {
    e.stopPropagation()
    onStart?.(template)
  }

  return (
    <Pressable
      onPress={handlePress}
      className="p-4 rounded-2xl bg-card-light/40 border border-card-lighter/20 mb-3"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          {template.icon && (
            <Text className="text-2xl mb-2">{template.icon}</Text>
          )}
          <Text className="text-white text-lg font-bold font-bbh mb-1">
            {template.title}
          </Text>
          {template.description && (
            <Text className="text-white/60 text-sm font-bbh line-clamp-2 mb-3">
              {template.description}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1.5">
            <RiCalendarLine size={16} className="text-white/40" />
            <Text className="text-white/60 text-xs font-bbh">
              {template.targetDays} days
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <RiUserLine size={16} className="text-white/40" />
            <Text className="text-white/60 text-xs font-bbh">
              {template._count?.startedGoals || 0} started
            </Text>
          </View>
        </View>

        <Button
          label="Start"
          variant="default"
          onClick={handleStart}
          disabled={isStarting}
          loading={isStarting}
          className="px-4 py-2"
          textClassName="text-sm"
        />
      </View>
    </Pressable>
  )
}
