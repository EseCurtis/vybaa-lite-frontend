import { LineChart } from '@/components/charts/line-chart.component'
import { EmptyList } from '@/components/common/empty-list.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInsights } from '@/hooks/use-insights.hook'
import { RiBarChartBoxLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'

export default function InsightsScreen() {
  const navigate = useNavigate()
  const { data: insightsData, isLoading } = useInsights()

  const insights = insightsData?.summary
  const chartData = insightsData?.chartData || []
  const hasData = insights && insights.totalGoals > 0

  return (
    <View className="flex-1 bg-cardd ">
      <NoiseComponent>
        <TabHeader title="Wellbeing">
          <Pressable
            onPress={() => navigate({ to: '/app/profile' })}
            className="text-white"
          ></Pressable>
        </TabHeader>

        <View className="overflow-y-auto no-scrollbar flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Spinner size={32} />
            </View>
          ) : !hasData ? (
            <View className="flex-1 px-mg">
              <EmptyList
                icon={<RiBarChartBoxLine size={64} className="text-white" />}
                title="No insights yet"
                description="Start creating and tracking goals to see your progress insights"
              />
            </View>
          ) : (
            <View className="flex-1 px-mg pb-[120px] pt-4 overflow-y-auto">
              <View className="space-y-4">
                {/* Activity Chart */}
                {chartData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-pink-500/20 rounded-3xl p-5 overflow-hidden "
                  >
                    <View className="space-y-4">
                      <View>
                        <Text className="text-white text-sm font-bbh font-semibold mb-1">
                          Activity (Last 30 Days)
                        </Text>
                        <Text className="text-purple-300/70 text-xs font-bbh">
                          Daily check-in trend
                        </Text>
                      </View>
                      <LineChart
                        data={chartData.map((d) => ({
                          date: d.date,
                          value: d.checkIns,
                        }))}
                        height={180}
                        color="#a78bfa"
                        showGrid={true}
                        showLabels={true}
                        animate={true}
                      />
                    </View>
                  </motion.div>
                )}

                {/* Hero Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20 rounded-3xl p-6 overflow-hidden relative "
                >
                  <View className="space-y-4">
                    <View>
                      <Text className="text-emerald-300/70 text-xs font-bbh mb-1 uppercase tracking-wider">
                        Total Check-Ins
                      </Text>
                      <Text className="text-white text-5xl font-bbh font-bold leading-none">
                        {insights?.totalCheckIns || 0}
                      </Text>
                      <Text className="text-emerald-200/70 text-sm font-bbh mt-1">
                        Days you showed up
                      </Text>
                    </View>

                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(insights?.completionRate || 0, 100)}%`,
                        }}
                        transition={{
                          duration: 1,
                          ease: 'easeOut',
                          delay: 0.2,
                        }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg shadow-emerald-500/50"
                      />
                    </div>
                    <Text className="text-emerald-300/60 text-xs font-bbh text-right">
                      {Math.round(insights?.completionRate || 0)}% overall
                      completion
                    </Text>
                  </View>
                </motion.div>

                {/* Stats Grid */}
                <View className="grid grid-cols-2 gap-3">
                  {/* Total Goals */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex flex-col rounded-2xl p-5 "
                  >
                    <Text className="text-blue-300/70 text-xs font-bbh mb-2 uppercase tracking-wide">
                      Total Goals
                    </Text>
                    <Text className="text-white text-4xl font-bbh font-bold drop-shadow-lg">
                      {insights?.totalGoals || 0}
                    </Text>
                  </motion.div>

                  {/* Current Streak */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-orange-500/20 to-red-500/20 flex flex-col rounded-2xl p-5 "
                  >
                    <Text className="text-orange-300/70 text-xs font-bbh mb-2 uppercase tracking-wide">
                      Current Streak
                    </Text>
                    <View className="flex-row items-baseline gap-1">
                      <Text className="text-white text-4xl font-bbh font-bold drop-shadow-lg">
                        {insights?.currentStreak || 0}
                      </Text>
                      <Text className="text-orange-200/70 text-sm font-bbh">
                        days
                      </Text>
                    </View>
                  </motion.div>

                  {/* Best Streak */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 flex flex-col rounded-2xl p-5 "
                  >
                    <Text className="text-yellow-300/70 text-xs font-bbh mb-2 uppercase tracking-wide">
                      Best Streak
                    </Text>
                    <View className="flex-row items-baseline gap-1">
                      <Text className="text-white text-4xl font-bbh font-bold drop-shadow-lg">
                        {insights?.longestStreak || 0}
                      </Text>
                      <Text className="text-yellow-200/70 text-sm font-bbh">
                        days
                      </Text>
                    </View>
                  </motion.div>

                  {/* Average Progress */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex flex-col rounded-2xl p-5 "
                  >
                    <Text className="text-pink-300/70 text-xs font-bbh mb-2 uppercase tracking-wide">
                      Avg Progress
                    </Text>
                    <Text className="text-white text-4xl font-bbh font-bold drop-shadow-lg">
                      {Math.round(insights?.averageProgress || 0)}%
                    </Text>
                  </motion.div>
                </View>
              </View>
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
