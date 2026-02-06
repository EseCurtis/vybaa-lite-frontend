import { BottomNotch } from '@/components/common/notch.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCheckIn, useDeleteGoal } from '@/hooks/use-goals.hook'
import { useToast } from '@/providers/toast.provider'
import type { Goal } from '@/shared/api/goal.api'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiDeleteBinLine } from '@remixicon/react'
import moment from 'moment'
import { GoalDurationPill } from './duration-pill.component'

interface GoalDetailsSheetProps {
  goal: Goal
  onDismiss?: () => void
  onEdit?: (goal: Goal) => void
}

export function GoalDetailsSheet({
  goal,
  onDismiss,
  onEdit,
}: GoalDetailsSheetProps) {
  const toast = useToast()
  const color = seededColor(goal.goalText)
  const { mutate: checkIn, isPending: isCheckingIn } = useCheckIn()
  const { mutate: deleteGoal, isPending: isDeleting } = useDeleteGoal()

  const progressPercentage = Math.min(
    (goal.currentDay / goal.targetDays) * 100,
    100,
  )

  const handleCheckIn = () => {
    checkIn(goal.id, {
      onSuccess: () => {
        onDismiss?.()
      },
    })
  }

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.',
      )
    ) {
      return
    }

    deleteGoal(goal.id, {
      onSuccess: () => {
        onDismiss?.()
      },
    })
  }

  const handleEdit = () => {
    onEdit?.(goal)
    onDismiss?.()
  }

  return (
    <View className="space-y-6">
      {/* Goal Card with Color */}
      <View className="rounded-3xl p-6" style={{ backgroundColor: color }}>
        <Text className="text-black text-sm font-bold font-bbh mb-4 leading-tight">
          {goal.goalText}
        </Text>

        <View className="flex-row items-center justify-between mb-4">
          <GoalDurationPill
            currentDay={goal.currentDay}
            targetDays={goal.targetDays}
          />

          <Text className="text-black/60 text-sm font-bbh">
            {Math.round(progressPercentage)}% complete
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="h-2 bg-black/10 rounded-full overflow-hidden">
          <View
            className="h-full bg-black/30 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </View>
      </View>

      <View className="flex-row w-full items-center justify-between">
        {/* Last Check-in Info */}
        {goal.lastCheckInDate && (
          <View className=" rounded-2xl p-4">
            <Text className="text-white/50 text-xs font-bbh mb-1">
              Last check-in
            </Text>
            <Text className="text-white text-sm font-bbh">
              {moment(new Date(goal.lastCheckInDate)).format('MMM d, yyyy')}
            </Text>
          </View>
        )}

        {goal.canCheckIn ? (
          <Button
            label="✓ Check In"
            variant="default"
            fullWidth
            onClick={handleCheckIn}
            disabled={isCheckingIn || isDeleting}
            loading={isCheckingIn}
            className="text-sm !bg-green-500 !w-full font-bold px-5 "
            textClassName="text-sm"
            style={!goal.lastCheckInDate ? {
              width: "100%"
            }: {}}
          />
        ) : (
          <View className="justify-center rounded-2xl p-4 text-center">
            <Text className="!text-success-green text-sm font-bold font-bbh">
              Done ✓
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 items-center w-full ">
        <View className="flex-row gap-3 w-full">
          <Pressable
            onPress={handleDelete}
            className="flex-1  bg-pink-900/20 hover:bg-pink-900/30 rounded-2xl p-4 flex-row items-center justify-center gap-2 transition-colors"
            disabled={isDeleting || isCheckingIn}
          >
            <RiDeleteBinLine className="text-pink-500" size={18} />
            <Text className="text-pink-500 text-sm font-bbh font-semibold">
              Delete
            </Text>
          </Pressable>
        </View>
      </View>

      <BottomNotch />
    </View>
  )
}
