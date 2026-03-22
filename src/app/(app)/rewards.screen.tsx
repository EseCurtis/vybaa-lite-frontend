import { EmptyList } from '@/components/common/empty-list.component'
import { Input } from '@/components/common/input.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Spinner } from '@/components/common/spinner.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { rewardsQueryKeys, useRewards } from '@/hooks/use-rewards.hook'
import { useWallet, walletQueryKeys } from '@/hooks/use-wallet.hook'
import { walletAPI } from '@/shared/api/wallet.api'
import { cn } from '@/shared/utils/helpers.util'
import {
  RiBankCardLine,
  RiCoinsLine,
  RiRefreshLine,
  RiTrophyLine,
} from '@remixicon/react'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

type WalletTab = 'MAIN' | 'PLAY'

export default function RewardsScreen() {
  const queryClient = useQueryClient()
  const { data: $rewards, isLoading, refetch } = useRewards()
  const {
    data: $wallet,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useWallet()
  const wallet = $wallet as any
  const rewards = $rewards as any
  const [tab, setTab] = useState<WalletTab>('MAIN')
  const [fundAmount, setFundAmount] = useState<string>('5000')
  const [isFunding, setIsFunding] = useState(false)

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: rewardsQueryKeys.all })
    queryClient.invalidateQueries({ queryKey: walletQueryKeys.all })
    refetch()
    refetchWallet()
  }

  // Default to Play Wallet if main wallet is not enabled
  useEffect(() => {
    if (wallet && !wallet.realWalletEnabled) {
      setTab('PLAY')
    }
  }, [wallet])

  const handleFundWithPaystack = async () => {
    const amountNumber = Number(fundAmount)
    if (!amountNumber || amountNumber <= 0) return
    try {
      setIsFunding(true)
      const res = await walletAPI.initPaystackFunding(amountNumber)
      const url = res.data.authorizationUrl
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      // toast handled in hooks/api layer if needed
      console.error(err)
    } finally {
      setIsFunding(false)
    }
  }

  const handleFundWithPolar = async () => {
    try {
      setIsFunding(true)
      const res = await walletAPI.initPolarFunding()
      const url = res.data.checkoutUrl
      if (url) {
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsFunding(false)
    }
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <TabHeader title="Wallet" canGoBack={false}>
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
          <TabHeader title="Wallet" canGoBack={false}>
            <Pressable
              onPress={handleRefresh}
              className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <RiRefreshLine size={20} />
            </Pressable>
          </TabHeader>
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
        <TabHeader title="Wallet" canGoBack={false}>
          <Pressable
            onPress={handleRefresh}
            className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RiRefreshLine size={20} />
          </Pressable>
        </TabHeader>
        <View className="px-mg pt-3">
          <View className="flex-row p-1 bg-card-light/30 rounded-full w-fit">
            {(['MAIN', 'PLAY'] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={cn(
                  'px-4 py-2 rounded-full transition-colors',
                  tab === t ? 'bg-white' : 'bg-transparent',
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-bbh',
                    tab === t ? 'text-black font-semibold' : 'text-white/70',
                  )}
                >
                  {t === 'MAIN' ? 'Main Wallet' : 'Play Wallet'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="px-mg py-6 space-y-6">
          {tab === 'MAIN' ? (
            wallet?.realWalletEnabled ? (
              <>
                {isLoadingWallet ? (
                  <View className="flex-1 items-center justify-center py-10">
                    <Spinner />
                  </View>
                ) : (
                  <>
                    <View className="rounded-2xl bg-card-light/10 p-6 space-y-2">
                      <View className="flex-row items-center gap-2">
                        <RiCoinsLine size={24} className="text-accent-400" />
                        <Text className="text-white/60 text-sm font-bbh">
                          Main Wallet Balance
                        </Text>
                      </View>
                      <Text className="text-white text-4xl font-bold font-bbh">
                        {(wallet?.mainWalletBalance ?? 0).toLocaleString()}
                      </Text>
                      <Text className="text-white/40 text-xs font-bbh">
                        Real points (funding via Paystack/Polar coming next)
                      </Text>
                    </View>

                    <View className="rounded-2xl bg-card-light/10 p-4 space-y-3">
                      <Text className="text-white/70 text-sm font-bbh mb-1">
                        Fund Main Wallet
                      </Text>
                      <View className="flex-row items-center gap-3">
                        <Input
                          type="number"
                          value={fundAmount}
                          onChange={(e) => setFundAmount(e.target.value)}
                          placeholder="Amount"
                          className="flex-1"
                        />
                      </View>
                      <View className="flex-row gap-3">
                        <Button
                          size="sm"
                          fullWidth
                          loading={isFunding}
                          disabled={isFunding}
                          onClick={handleFundWithPaystack}
                          leftIcon={<RiBankCardLine size={16} />}
                          label="Paystack"
                        />
                        <Button
                          size="sm"
                          fullWidth
                          loading={isFunding}
                          disabled={isFunding}
                          onClick={handleFundWithPolar}
                          label="Polar.sh"
                        />
                      </View>
                    </View>

                    {!wallet?.realWalletEnabled && (
                      <View className="rounded-2xl bg-card-light/10 p-6">
                        <EmptyList
                          icon={
                            <RiCoinsLine size={48} className="text-white/40" />
                          }
                          title="Main Wallet is not enabled yet"
                          description="We’ll roll this out gradually. Your Play Wallet is still active."
                        />
                      </View>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <View className="rounded-2xl bg-card-light/10 p-6">
                  <EmptyList
                    icon={<RiCoinsLine size={48} className="text-white/40" />}
                    title="Main Wallet - Coming soon"
                    description="We’ll roll this out soon."
                  />
                </View>
              </>
            )
          ) : (
            <>
              {/* Play Wallet (existing system) */}
              <View className="rounded-2xl bg-card-light/10 p-6 space-y-2">
                <View className="flex-row items-center gap-2">
                  <RiCoinsLine size={24} className="text-accent-400" />
                  <Text className="text-white/60 text-sm font-bbh">
                    Play Wallet Balance
                  </Text>
                </View>
                <Text className="text-white text-4xl font-bold font-bbh">
                  {rewards.balance.toLocaleString()}
                </Text>
                <Text className="text-white/40 text-xs font-bbh">
                  Play Points earned from completed goals
                </Text>
              </View>

              {rewards.pendingPoints > 0 ? (
                <View className="rounded-2xl bg-card-light/10 p-6 space-y-3">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-2">
                      <RiTrophyLine size={20} className="text-accent-400" />
                      <Text className="text-white/80 text-sm font-bbh">
                        Pending Play Points
                      </Text>
                    </View>
                    <Text className="text-accent-400 text-2xl font-bold font-bbh">
                      {rewards.pendingPoints.toLocaleString()}
                    </Text>
                  </View>
                  <Text className="text-white/50 text-xs font-bbh">
                    These Play Points will be added to your balance when you
                    complete your goals
                  </Text>

                  {rewards.pendingBreakdown.length > 0 && (
                    <View className="mt-4 space-y-2">
                      <Text className="text-white/60 text-xs font-bbh mb-2">
                        Pending from:
                      </Text>
                      {rewards.pendingBreakdown.map((item: any) => (
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
            </>
          )}
        </View>
      </NoiseComponent>
    </View>
  )
}
