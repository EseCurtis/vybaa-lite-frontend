import { useSubscription } from '@/providers/subscription.provider'
import { RiVerifiedBadgeFill, RiVerifiedBadgeLine } from '@remixicon/react'
import { View } from '../layout/view.component'

export function UserCheckmark() {
  const { isPro } = useSubscription()
  return (
    !isPro && (
      <View className="relative">
        <RiVerifiedBadgeLine size={15} className="text-white absolute " />
        <RiVerifiedBadgeFill
          size={15}
          className="text-accent-600 relative z-10"
        />
      </View>
    )
  )
}
