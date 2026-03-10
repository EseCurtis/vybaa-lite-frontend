import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { EmptyList } from '@/components/common/empty-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewards, rewardsQueryKeys } from '@/hooks/use-rewards.hook'
import { RiCoinsLine, RiTrophyLine, RiRefreshLine } from '@remixicon/react'
import { useQueryClient } from '@tanstack/react-query'

export default function RewardsScreen() {
  const queryClient = useQueryClient()
  const { data: rewards, isLoading, refetch } = useRewards()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: rewardsQueryKeys.all })
    refetch()
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Play Points" canGoBack={false}>
            <Pressable
              onPress={handleRefresh}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RiRefreshLine size={20} />
            </Pressable>
          </TabHeader>
          <View className="flex-1 items-center justify-center">
            <Spinner />
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (!rewards) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Play Points" canGoBack={false}>
            <Pressable
              onPress={handleRefresh}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RiRefreshLine size={20} />
            </Pressable>
          </TabHeader>
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-white/60 text-lg font-bbh text-center">
              Unable to load Play Points
            </Text>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cardd overflow-y-auto">
      <NoiseComponent>
        <TabHeader title="Play Points" canGoBack={false}>
          <Pressable
            onPress={handleRefresh}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RiRefreshLine size={20} />
          </Pressable>
        </TabHeader>
        <View className="px-mg py-6 space-y-6">
          {/* Balance Card */}
          <View className="rounded-2xl bg-card-light/10 p-6 space-y-2">
            <View className="flex-row items-center gap-2">
              <RiCoinsLine size={24} className="text-accent-400" />
              <Text className="text-white/60 text-sm font-bbh">Total Balance</Text>
            </View>
            <Text className="text-white text-4xl font-bold font-bbh">
              {rewards.balance.toLocaleString()}
            </Text>
            <Text className="text-white/40 text-xs font-bbh">
              Play Points earned from completed goals
            </Text>
          </View>

          {/* Pending Points Card */}
          {rewards.pendingPoints > 0 ? (
            <View className="rounded-2xl bg-card-light/10 p-6 space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <RiTrophyLine size={20} className="text-accent-400" />
                  <Text className="text-white/80 text-sm font-bbh">Pending Play Points</Text>
                </View>
                <Text className="text-accent-400 text-2xl font-bold font-bbh">
                  {rewards.pendingPoints.toLocaleString()}
                </Text>
              </View>
              <Text className="text-white/50 text-xs font-bbh">
                These Play Points will be added to your balance when you complete your goals
              </Text>

              {/* Pending Breakdown */}
              {rewards.pendingBreakdown.length > 0 && (
                <View className="mt-4 space-y-2">
                  <Text className="text-white/60 text-xs font-bbh mb-2">
                    Pending from:
                  </Text>
                  {rewards.pendingBreakdown.map((item) => (
                    <View
                      key={item.goalId}
                      className="rounded-xl bg-card-light/5 p-3 space-y-1"
                    >
                      <Text className="text-white/80 text-sm font-bbh">
                        {item.goalText}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white/50 text-xs font-bbh">
                          {item.community?.name && (
                            <Text className="text-white/50 text-xs font-bbh">
                              {item.community.name} •{' '}
                            </Text>
                          )}
                          Day {item.currentDay} / {item.targetDays}
                        </Text>
                        <Text className="text-accent-400 text-xs font-bbh">
                          +{item.pendingPoints} Play Points
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View className="rounded-2xl bg-card-light/10 p-6">
              <EmptyList
                icon={<RiTrophyLine size={48} className="text-white/40" />}
                title="No pending Play Points"
                description="Complete goals with milestones to earn pending Play Points"
              />
            </View>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
