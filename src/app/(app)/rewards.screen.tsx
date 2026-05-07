import { MainWalletPanel } from '@/app/(app)/components/rewards/main-wallet-panel.component'
import { PlayWalletPanel } from '@/app/(app)/components/rewards/play-wallet-panel.component'
import { RewardsHeader } from '@/app/(app)/components/rewards/rewards-header.component'
import { WalletTabs, type WalletTab } from '@/app/(app)/components/rewards/wallet-tabs.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { rewardsQueryKeys, useRewards } from '@/hooks/use-rewards.hook'
import { useWallet, walletQueryKeys } from '@/hooks/use-wallet.hook'
import type { RewardsData } from '@/shared/api/rewards.api'
import { walletAPI, type WalletData } from '@/shared/api/wallet.api'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export default function RewardsScreen() {
  const queryClient = useQueryClient()
  const rewardsQuery = useRewards()
  const walletQuery = useWallet()
  const rewards = rewardsQuery.data as RewardsData | undefined
  const wallet = walletQuery.data as WalletData | undefined
  const { isLoading, refetch } = rewardsQuery
  const {
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = walletQuery
  const [tab, setTab] = useState<WalletTab>('MAIN')
  const [fundAmount, setFundAmount] = useState<string>('5000')
  const [isFunding, setIsFunding] = useState(false)

  function handleRefresh(): void {
    queryClient.invalidateQueries({ queryKey: rewardsQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: walletQueryKeys.all })
    refetch()
    refetchWallet()
  }

  useEffect(() => {
    if (wallet && !wallet.realWalletEnabled) {
      setTab('PLAY')
    }
  }, [wallet])

  async function handleFundWithPaystack(): Promise<void> {
    const amountNumber = Number(fundAmount)
    if (!amountNumber || amountNumber <= 0) {
      return
    }

    try {
      setIsFunding(true)
      const res = await walletAPI.initPaystackFunding(amountNumber)
      const url = res.data.authorizationUrl
      if (url) {
        window.open(url, '_blank')
      }
    } catch {
    } finally {
      setIsFunding(false)
    }
  }

  async function handleFundWithPolar(): Promise<void> {
    try {
      setIsFunding(true)
      const res = await walletAPI.initPolarFunding()
      const url = res.data.checkoutUrl
      if (url) {
        window.open(url, '_blank')
      }
    } catch {
    } finally {
      setIsFunding(false)
    }
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
        <WalletTabs tab={tab} onChange={setTab} />

        <View className="px-mg py-6 space-y-6">
          {tab === 'MAIN' ? (
            <MainWalletPanel
              fundAmount={fundAmount}
              isFunding={isFunding}
              isLoadingWallet={isLoadingWallet}
              onFundAmountChange={setFundAmount}
              onFundWithPaystack={handleFundWithPaystack}
              onFundWithPolar={handleFundWithPolar}
              wallet={wallet}
            />
          ) : (
            <PlayWalletPanel rewards={rewards} />
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
