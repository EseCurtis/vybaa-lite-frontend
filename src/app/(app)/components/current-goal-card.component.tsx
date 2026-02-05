import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { Goal } from '@/shared/api/goal.api'
import { motion } from 'framer-motion'

interface CurrentGoalCardProps {
  currentGoal: Goal | null
  isCheckingIn: boolean
  loading: boolean
  onCheckIn: (goalId: string) => void
}

export function CurrentGoalCard({
  currentGoal,
  isCheckingIn,
  loading,
  onCheckIn,
}: CurrentGoalCardProps) {
  if (!currentGoal) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <View className="bg-card-700/50 rounded-3xl p-8 text-center">
          <Text className="text-white/40 text-sm font-bbh">
            No active goal
          </Text>
        </View>
      </motion.div>
    )
  }

  const progressPercentage = Math.min(
    (currentGoal.currentDay / currentGoal.targetDays) * 100,
    100
  )

  // Progress ring calculations
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progressPercentage / 100)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className="mb-6"
    >
      <View className="bg-gradient-to-br from-cardd  to-card-light-50/20 rounded-3xl p-6 overflow-hidden relative">
        {/* Progress Ring Background */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
          <svg className="w-[90%] h-[90%] transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-white/20"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              className="text-white"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
        </div>

        <View className="relative z-10 space-y-5">
          {/* Day Counter - Big & Bold */}
          <View className="flex items-center justify-center">
            <motion.div
              key={currentGoal.currentDay}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <Text className="text-white text-7xl font-bbh font-bold leading-none">
                {currentGoal.currentDay}
              </Text>
              <Text className="text-white/50 text-sm font-bbh mt-1">
                of {currentGoal.targetDays} days
              </Text>
            </motion.div>
          </View>

          {/* Goal Text */}
          <View className="text-center">
            <Text className="text-white/90 text-lg font-bbh leading-relaxed">
              {currentGoal.goalText}
            </Text>
          </View>

          {/* Progress Bar */}
          {/* <View className="space-y-2">
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-white/30 to-white/50 rounded-full"
              />
            </div>
            <Text className="text-white/40 text-xs font-bbh text-center">
              {Math.round(progressPercentage)}% complete
            </Text>
          </View> */}

          {/* Quick Check-In Button */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.02 }}
            className="flex flex-row justify-center"
          >
            <Button
              label="✓ Check In"
              variant="default"
              fullWidth
              onClick={() => onCheckIn(currentGoal.id)}
              disabled={isCheckingIn || loading}
              loading={isCheckingIn}
              className="text-sm font-bold"
              textClassName='text-md'
            />
          </motion.div>
        </View>
      </View>
    </motion.div>
  )
}
