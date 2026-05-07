import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { cn } from '@/shared/utils/helpers.util'

export type WalletTab = 'MAIN' | 'PLAY'

interface WalletTabsProps {
  onChange: (tab: WalletTab) => void
  tab: WalletTab
}

const walletTabs: WalletTab[] = ['MAIN', 'PLAY']

export function WalletTabs({ onChange, tab }: WalletTabsProps) {
  return (
    <View className="px-mg pt-3">
      <View className="flex-row p-1 bg-card-light/30 rounded-full w-fit">
        {walletTabs.map((walletTab) => (
          <Pressable
            key={walletTab}
            onPress={() => onChange(walletTab)}
            className={cn(
              'px-4 py-2 rounded-full transition-colors',
              tab === walletTab ? 'bg-white' : 'bg-transparent',
            )}
          >
            <Text
              className={cn(
                'text-sm font-bbh',
                tab === walletTab
                  ? 'text-black font-semibold'
                  : 'text-white/70',
              )}
            >
              {walletTab === 'MAIN' ? 'Main Wallet' : 'Play Wallet'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
