import { PlayWalletPanel } from '@/app/(app)/components/rewards/play-wallet-panel.component'
import { RewardsHeader } from '@/app/(app)/components/rewards/rewards-header.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { rewardsQueryKeys, useRewards } from '@/hooks/use-rewards.hook'
import type { RewardsData } from '@/shared/api/rewards.api'
import { useQueryClient } from '@tanstack/react-query'

export default function RewardsScreen() {
  const queryClient = useQueryClient()
  const rewardsQuery = useRewards()
  const rewards = rewardsQuery.data as RewardsData | undefined
  const { isLoading, refetch } = rewardsQuery

  function handleRefresh(): void {
    queryClient.invalidateQueries({ queryKey: rewardsQueryKeys.all })
    refetch()
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <RewardsHeader onRefresh={handleRefresh} />
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
          <RewardsHeader onRefresh={handleRefresh} />
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-white/60 text-lg font-bbh text-center">
              Unable to load wallet
            </Text>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-cardd overflow-y-auto">
      <NoiseComponent>
        <RewardsHeader onRefresh={handleRefresh} />

        <View className="px-mg py-6 space-y-3">
          <PlayWalletPanel rewards={rewards} />
        </View>
      </NoiseComponent>
    </View>
  )
}
