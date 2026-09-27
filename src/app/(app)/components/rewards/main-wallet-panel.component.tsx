import { EmptyList } from '@/components/common/empty-list.component'
import { Input } from '@/components/common/input.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import type { WalletData } from '@/shared/api/wallet.api'
import { RiBankCardLine, RiCoinsLine } from '@remixicon/react'

interface MainWalletPanelProps {
  fundAmount: string
  isFunding: boolean
  isLoadingWallet: boolean
  onFundAmountChange: (value: string) => void
  onFundWithPaystack: () => void
  onFundWithPolar: () => void
  wallet: WalletData | undefined
}

export function MainWalletPanel({
  fundAmount,
  isFunding,
  isLoadingWallet,
  onFundAmountChange,
  onFundWithPaystack,
  onFundWithPolar,
  wallet,
}: MainWalletPanelProps) {
  if (!wallet?.realWalletEnabled) {
    return (
      <View className="rounded-2xl bg-card-light/10 p-6">
        <EmptyList
          icon={<RiCoinsLine size={48} className="text-white/40" />}
          title="Main Wallet - Coming soon"
          description="We’ll roll this out soon."
        />
      </View>
    )
  }

  if (isLoadingWallet) {
    return (
      <View className="gap-4 py-10">
        <Skeleton className="h-32 w-full" rounded="xl" />
        <Skeleton className="h-20 w-full" rounded="xl" />
      </View>
    )
  }

  return (
    <>
      <View className="rounded-2xl bg-card-light/10 p-6 space-y-2">
        <View className="flex-row items-center gap-2">
          <RiCoinsLine size={24} className="text-accent-400" />
          <Text className="text-white/60 text-sm font-bbh">
            Main Wallet Balance
          </Text>
        </View>
        <Text className="text-white text-4xl font-bold font-bbh">
          {(wallet.mainWalletBalance ?? 0).toLocaleString()}
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
            onChange={(event) => {
              onFundAmountChange(event.target.value)
            }}
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
            onClick={onFundWithPaystack}
            leftIcon={<RiBankCardLine size={16} />}
            label="Paystack"
          />
          <Button
            size="sm"
            fullWidth
            loading={isFunding}
            disabled={isFunding}
            onClick={onFundWithPolar}
            label="Polar.sh"
          />
        </View>
      </View>
    </>
  )
}
