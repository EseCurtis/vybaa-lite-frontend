import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { RiRefreshLine } from '@remixicon/react'

interface RewardsHeaderProps {
  onRefresh: () => void
}

export function RewardsHeader({ onRefresh }: RewardsHeaderProps) {
  return (
    <TabHeader title="Wallet" canGoBack={false}>
      <Pressable
        onPress={onRefresh}
        className="text-white p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <RiRefreshLine size={20} />
      </Pressable>
    </TabHeader>
  )
}
