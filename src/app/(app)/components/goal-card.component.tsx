import { Button } from '@/components/layout/button.component'
import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Goal } from '@/shared/api/goal.api'
import { cn } from '@/shared/utils/helpers.util'
import { motion } from 'framer-motion'

interface GoalCardProps {
  goal: Goal
  index: number
  isActive: boolean
  isCheckingIn: boolean
  isUpdating: boolean
  isDeleting: boolean
  onCheckIn: (goalId: string) => void
  onEdit: (goal: Goal) => void
  onDelete: (goalId: string) => void
}

export function GoalCard({
  goal,
  index,
  isActive,
  isCheckingIn,
  isUpdating,
  isDeleting,
  onCheckIn,
  onEdit,
  onDelete,
}: GoalCardProps) {
  const goalProgress = (goal.currentDay / goal.targetDays) * 100

  return (
    <motion.div
      key={goal.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
    >
      <View
        className={cn(
          'bg-card-700/60 backdrop-blur-sm rounded-2xl p-4 transition-all',
          isActive && 'bg-card-700/80'
        )}
      >
        <View className="space-y-3">
          {/* Header Row */}
          <View className="flex flex-row items-start justify-between gap-3">
            <View className="flex-1 space-y-1 min-w-0">
              <Text className="text-white font-bbh text-sm leading-snug line-clamp-2">
                {goal.goalText}
              </Text>
              <View className="flex flex-row items-center gap-3">
                <Text className="text-white/50 text-xs font-bbh">
                  {goal.currentDay}/{goal.targetDays}
                </Text>
                {isActive && (
                  <View className="bg-white/20 rounded-full px-2 py-0.5">
                    <Text className="text-white text-[10px] font-bbh font-semibold uppercase tracking-wider">
                      Active
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex flex-row items-center gap-1">
              <button
                onClick={() => onEdit(goal)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Icons.Edit size="xs" color="#ffffff" />
              </button>
              <button
                onClick={() => onDelete(goal.id)}
                className="p-1.5 hover:bg-danger-500/20 rounded-lg transition-colors"
                disabled={isUpdating || isDeleting}
              >
                <Icons.Trash size="xs" color="#EF4444" />
              </button>
            </View>
          </View>

          {/* Mini Progress */}
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-white/30 rounded-full"
            />
          </div>

          {/* Check In Button */}
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              label="Check In"
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => onCheckIn(goal.id)}
              disabled={isCheckingIn || isDeleting}
              loading={isCheckingIn}
              className="text-xs"
            />
          </motion.div>
        </View>
      </View>
    </motion.div>
  )
}
