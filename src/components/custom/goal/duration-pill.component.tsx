import { Text } from '@/components/layout/text.component';
import { View } from '@/components/layout/view.component';

export function GoalDurationPill({
  targetDays,
  currentDay,
}: {
  targetDays: number
  currentDay: number | string
}) {
  const hasStarted =  parseInt(String(currentDay)) > 0;
  currentDay = currentDay == 0 ? 'Start' : currentDay

  return (
    <View className="justify-end">
      <View className="bg-black/20 p-2 w-auto  items-center justify-center rounded-full">
        <Text className="text-black/30 font-bold text-sm whitespace-nowrap">
          {hasStarted ? `${currentDay} of ${targetDays} day${targetDays > 1 && 's'}`: `${targetDays} day${targetDays > 1 && 's'}`}
        </Text>
      </View>
    </View>
  )
}
