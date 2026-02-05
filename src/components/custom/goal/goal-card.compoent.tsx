import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCheckIn } from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { Moti } from '@/shared/constants.shared'
import { seededColor } from '@/shared/utils/helpers.util'

export function GoalCard({
  id,
  goalText,
  currentDay,
  targetDays,
  canCheckIn,
}: Goal) {
  const color = seededColor(goalText)
  const { mutate, isPending } = useCheckIn()

  return (
    <View
      className="p-3 mt-3 rounded-3xl"
      style={{
        backgroundColor: color,
      }}
    >
      <View className="flex-col items-start">
        <Text className="mb-3">
          {goalText} cooking and eating food and biscuit for long long
        </Text>
      </View>
      <View className="flex-row justify-between">
        <View className="bg-black/20 p-2 w-auto  items-center justify-center rounded-full">
          <Text className="text-black/30 font-bold text-sm">
            Day {currentDay} of {targetDays}
          </Text>
        </View>

        <Moti.div
          whileTap={{ scale: 0.98 }}
          whileHover={{ scale: 1.02 }}
          className="flex flex-row justify-center"
        >
          {canCheckIn ? (
            <Button
              label="✓ Check In"
              variant="default"
              fullWidth
              onClick={() => mutate(id)}
              disabled={isPending}
              loading={isPending}
              className="text-sm font-bold px-4 !py-1"
              textClassName="text-sm"
            />
          ) : (
            <Pressable className="snap-center ml-2 text-black   rounded-full flex-row gap-2 items-center justify-center px-2 mx-auto py-2 font-bold">
              <Text className="whitespace-nowrap text-sm">Done</Text>
            </Pressable>
          )}
        </Moti.div>
      </View>
    </View>
  )
}
