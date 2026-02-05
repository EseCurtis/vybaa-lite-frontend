import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export function GoalDurationPill({
  targetDays,
  currentDay,
}: {
  targetDays: number
  currentDay: number | string
}) {
  currentDay = currentDay == 0 ? 'None' : currentDay

  return (
  <View className="justify-end">
      <View className="bg-black/20 p-2 w-auto  items-center justify-center rounded-full">
      <Text className="text-black/30 font-bold text-sm">
        {currentDay} of {targetDays} day{targetDays > 1 && 's'}
      </Text>
    </View>
  </View>
  )
}
