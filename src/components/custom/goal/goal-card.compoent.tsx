import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useDeleteGoal } from '@/hooks/use-goals.hook'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useToast } from '@/providers/toast.provider'
import type { Goal } from '@/shared/api/goal.api'
import { Moti } from '@/shared/constants.shared'
import { seededColor } from '@/shared/utils/helpers.util'
import { RiDeleteBinLine, RiFireFill } from '@remixicon/react'
import { motion } from 'framer-motion'
import { GoalDurationPill } from './duration-pill.component'
import { GoalDetailsSheet } from './goal-details-sheet.component'

interface GoalCardProps extends Goal {
  onPress?: (goal: Goal) => void
  bulkMode?: boolean
  isSelected?: boolean
  onToggleSelection?: (goalId: string) => void
}

export function GoalCard({
  id,
  goalText,
  currentDay,
  targetDays,
  canCheckIn,
  lastCheckInDate,
  startedAt,
  onPress,
  bulkMode = false,
  isSelected = false,
  onToggleSelection,
}: GoalCardProps) {
  const toast = useToast()
  const color = seededColor(goalText)
  const { mutate: deleteMutate, isPending: deleteIsPending } = useDeleteGoal()
  const bottomSheet = useBottomSheet()

  const onDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this goal? This action cannot be undone.',
      )
    ) {
      return
    }

    try {
      deleteMutate(id)
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const handleCardClick = () => {
    if (bulkMode && onToggleSelection) {
      onToggleSelection(id)
    } else if (onPress) {
      onPress({
        id,
        goalText,
        currentDay,
        targetDays,
        canCheckIn,
        lastCheckInDate,
        startedAt,
      })
    }
  }

  return (
    <View className="flex-row mt-3 w-full overflow-x-scroll no-scrollbar snap-x snap-mandatory gap-3">
      <Pressable
        onPress={handleCardClick}
        className={`p-2 flex flex-col w-full shrink-0 rounded-3xl relative snap-center transition-all ${
          isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-cardd' : ''
        }`}
        style={{
          backgroundColor: color,
        }}
      >
        {/* Bulk Selection Checkbox */}
        {bulkMode && (
          <View className="absolute top-3 right-3 z-10">
            <View
              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                isSelected
                  ? 'bg-black border-black'
                  : 'bg-black/20 border-black/40'
              }`}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500 }}
                >
                  <Text className="text-white text-sm font-bold">✓</Text>
                </motion.div>
              )}
            </View>
          </View>
        )}
        
        <View className="flex-col items-start pl-3">
          <Text className="mb-3 max-w-[80vw]">{goalText}</Text>
        </View>
        <View className="flex-row w-full justify-between">
          <GoalDurationPill currentDay={currentDay} targetDays={targetDays} />

          <Moti.div
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            className="flex flex-row justify-center"
            onClick={(e: any) => e.stopPropagation()}
          >
            {canCheckIn ? (
              <Button
                leftIcon={<RiFireFill color={"#0a0e16"}/>}
                variant="default"
                fullWidth
                onClick={async (e) => {
                  e.stopPropagation()
                  const goal: Goal = {
                    id,
                    goalText,
                    currentDay,
                    targetDays,
                    canCheckIn,
                    lastCheckInDate,
                    startedAt,
                  }
                  bottomSheet.present(
                    <GoalDetailsSheet
                      goal={goal}
                      onDismiss={bottomSheet.dismiss}
                    />,
                    {
                      title: 'Goal Details',
                      elevation: 999,
                    }
                  )
                }}
                className="text-sm font-bold border-2 border-cardd !bg-black/20  p-2 h-auto"
                textClassName="text-sm"
                bgColor={color}
              />
            ) : (
              <Button
                leftIcon={<RiFireFill color={color}/>}
                variant="default"
                fullWidth
                disabled
                className="text-sm font-bold !bg-cardd border-2 border-transparent  p-2 h-auto"
                textClassName="text-sm"
                bgColor="rgb(6 5 9 / 0.01)"
              />
            )}
          </Moti.div>
        </View>
      </Pressable>

      <View className="flex-row items-center justify-center snap-center">
        <View className=" w-[70px] h-full   flex-row items-center justify-center">
          <Pressable
            onPress={onDelete}
            className="p-1.5 bg-pink-900/30 rounded-xl size-full flex flex-row items-center justify-center transition-colors"
            disabled={deleteIsPending || deleteIsPending}
          >
            <RiDeleteBinLine className="text-pink-500" />
          </Pressable>
        </View>
      </View>
    </View>
  )
}
