import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import type { User } from '@/shared/types/auth.types'
import { RiNotificationLine } from '@remixicon/react'

export function HomeHeader({ user }: { user: User }) {
  return (
    <View className="flex-row items-center justify-between w-full pt-mg px-mg">
      <Avatar user={user!} size={40} />

      <View className="">
        <RiNotificationLine className="text-card-lighter-3" />
      </View>
    </View>
  )
}
