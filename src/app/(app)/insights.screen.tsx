import { TopNotchPadd } from '@/components/common/notch.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { Icons } from '@/components/layout/icon.component'

export default function InsightsScreen() {
  const { goals, currentGoal, isLoading } = useGoalOperations()

  // Calculate insights
  const insights = useMemo(() => {
    if (!goals.length) {
      return {
        totalGoals: 0,
        activeGoals: 0,
        totalDays: 0,
        completedDays: 0,
        averageProgress: 0,
        longestStreak: 0,
        totalCheckIns: 0,
        completionRate: 0,
      }
    }

    const activeGoals = goals.filter((g) => g.id === currentGoal?.id).length
    const totalDays = goals.reduce((sum, g) => sum + g.targetDays, 0)
    const completedDays = goals.reduce((sum, g) => sum + g.currentDay, 0)
    const totalCheckIns = goals.reduce((sum, g) => sum + g.currentDay, 0)
    const averageProgress =
      goals.reduce((sum, g) => sum + (g.currentDay / g.targetDays) * 100, 0) /
      goals.length
    const longestStreak = Math.max(...goals.map((g) => g.currentDay), 0)
    const completionRate = (completedDays / totalDays) * 100

    return {
      totalGoals: goals.length,
      activeGoals,
      totalDays,
      completedDays,
      averageProgress,
      longestStreak,
      totalCheckIns,
      completionRate,
    }
  }, [goals, currentGoal])

  if (isLoading) {
    return (
      <View className="flex-1 bg-black">
        <TopNotchPadd />
        <TopNotchPadd />
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/40 text-sm font-bbh">Loading...</Text>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      <TopNotchPadd />
      <TopNotchPadd />

      <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
            Insights
          </Text>
        </motion.div>

        {goals.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card-700/30 rounded-3xl p-12 text-center"
          >
            <Icons.Info size="lg" color="#ffffff40" className="mx-auto mb-4" />
            <Text className="text-white/40 text-sm font-bbh">
              No goals yet. Start tracking to see insights.
            </Text>
          </motion.div>
        ) : (
          <View className="space-y-6">
            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, type: 'spring' }}
              className="bg-gradient-to-br from-card-700 via-card-700 to-card-800 rounded-3xl p-8 overflow-hidden relative"
            >
              <View className="relative z-10 space-y-6">
                <View className="text-center">
                  <Text className="text-white text-6xl font-bbh font-bold leading-none">
                    {insights.totalCheckIns}
                  </Text>
                  <Text className="text-white/50 text-sm font-bbh mt-2">
                    Total Check-ins
                  </Text>
                </View>

                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${insights.completionRate}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-white/30 to-white/50 rounded-full"
                  />
                </div>
              </View>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Total Goals */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card-700/60 backdrop-blur-sm rounded-2xl p-6"
              >
                <Text className="text-white/50 text-xs font-bbh mb-2 uppercase tracking-wider">
                  Goals
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {insights.totalGoals}
                </Text>
              </motion.div>

              {/* Longest Streak */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-card-700/60 backdrop-blur-sm rounded-2xl p-6"
              >
                <Text className="text-white/50 text-xs font-bbh mb-2 uppercase tracking-wider">
                  Longest Streak
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {insights.longestStreak}
                </Text>
              </motion.div>

              {/* Average Progress */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card-700/60 backdrop-blur-sm rounded-2xl p-6"
              >
                <Text className="text-white/50 text-xs font-bbh mb-2 uppercase tracking-wider">
                  Avg Progress
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {Math.round(insights.averageProgress)}%
                </Text>
              </motion.div>

              {/* Completion Rate */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card-700/60 backdrop-blur-sm rounded-2xl p-6"
              >
                <Text className="text-white/50 text-xs font-bbh mb-2 uppercase tracking-wider">
                  Completion
                </Text>
                <Text className="text-white text-3xl font-bbh font-bold">
                  {Math.round(insights.completionRate)}%
                </Text>
              </motion.div>
            </div>

            {/* Progress Breakdown */}
            {goals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card-700/60 backdrop-blur-sm rounded-2xl p-6 space-y-4"
              >
                <Text className="text-white text-lg font-bbh font-bold">
                  Goal Progress
                </Text>
                <View className="space-y-3">
                  {goals.map((goal, index) => {
                    const progress = (goal.currentDay / goal.targetDays) * 100
                    const isActive = goal.id === currentGoal?.id

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="space-y-2"
                      >
                        <View className="flex flex-row items-center justify-between">
                          <Text
                            className={cn(
                              'text-white/90 text-sm font-bbh line-clamp-1 flex-1',
                              isActive && 'text-white'
                            )}
                          >
                            {goal.goalText}
                          </Text>
                          {isActive && (
                            <View className="bg-white/20 rounded-full px-2 py-0.5 ml-2">
                              <Text className="text-white text-[10px] font-bbh font-semibold uppercase tracking-wider">
                                Active
                              </Text>
                            </View>
                          )}
                        </View>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                            className="h-full bg-white/30 rounded-full"
                          />
                        </div>
                        <View className="flex flex-row items-center justify-between">
                          <Text className="text-white/40 text-xs font-bbh">
                            {goal.currentDay} / {goal.targetDays} days
                          </Text>
                          <Text className="text-white/40 text-xs font-bbh">
                            {Math.round(progress)}%
                          </Text>
                        </View>
                      </motion.div>
                    )
                  })}
                </View>
              </motion.div>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

// Add missing import
import { cn } from '@/shared/utils/helpers.util'
