import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Avatar } from '@/components/user/avatar.component'
import { useUnreadCount } from '@/hooks/use-notifications.hook'
import type { User } from '@/shared/types/auth.types'
import { RiNotificationLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'

export function HomeHeader({ user }: { user: User }) {
  const navigate = useNavigate()
  const { data: unreadCount } = useUnreadCount()

  return (
    <View className="flex-row items-center justify-between w-full pt-mg px-mg">
      <Avatar user={user!} size={40} />

      <Pressable
        onPress={() => {
          navigate({ to: '/notifications' })
        }}
        className="relative"
      >
        <RiNotificationLine className="text-card-lighter-3" />
        
        {/* Unread Badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-danger-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bbh font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  )
}
