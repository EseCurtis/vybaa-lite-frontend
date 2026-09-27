import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export function GoalDurationPill({
  label,
  targetDays,
  currentDay,
}: {
  label?: string
  targetDays: number
  currentDay: number | string
}) {
  if (label) {
    return (
      <View className="justify-end">
        <View className="bg-black/20 p-2 px-3 w-auto items-center justify-center rounded-full">
          <Text className="text-black/70 font-bold text-sm whitespace-nowrap">
            {label}
          </Text>
        </View>
      </View>
    )
  }
  const hasStarted = parseInt(String(currentDay)) > 0
  currentDay = currentDay == 0 ? 'Start' : currentDay

  return (
    <View className="justify-end">
      <View className="bg-black/20 p-2 w-auto  items-center justify-center rounded-full">
        <Text className="text-black/30 font-bold text-sm whitespace-nowrap">
          {hasStarted
            ? `${currentDay} of ${targetDays} day${targetDays > 1 && 's'}`
            : `${targetDays} day${targetDays > 1 && 's'}`}
        </Text>
      </View>
    </View>
  )
}
