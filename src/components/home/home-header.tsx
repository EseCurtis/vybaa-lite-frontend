import { Skeleton } from '@/components/common/skeleton.component';
import { Icons } from '@/components/layout/icon.component';
import { TouchableOpacity } from '@/components/layout/pressables.component';
import { Text } from '@/components/layout/text.component';
import { View } from '@/components/layout/view.component';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications.hook';
import { useNavigate } from '@tanstack/react-router';

export function HomeHeader({ firstName, mood }: { firstName?: string; mood?: string }) {
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'GM'
    if (hour < 17) return 'Wassup'
    return 'Yo'
  }
  const getMoodSummary = (m: string | undefined) => {
    const summaries: Record<string, string> = {
      thriving: "You're in your main character era ✨",
      chillin: "You're in your calm era 🧘🏽‍♀️",
      overwhelmed: "You're in your reset era 🔄",
      glowup: "You're in your glow-up era 💅",
    }
    return summaries[m || 'thriving'] || summaries.thriving
  }
  if (!firstName) {
    return (
      <View className="mb-6">
        <Skeleton className="w-48 h-6 rounded mb-2" />
        <Skeleton className="w-64 h-5 rounded" />
      </View>
    )
  }

  return (
    <View className="mb-6 ovexrflow-x-hidden">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-white text-xl font-bold font-bbh mb-2">
            {getGreeting()}, {firstName} 👋
          </Text>
          <Text className="text-white/80 text-lg font-bbh-mini font-bbh">
            {getMoodSummary(mood)}
          </Text>
        </View>
        <TouchableOpacity
          className="relative rounded-full border border-[#2a2a2a] p-2 text-white hover:bg-white/10 backdrop-blur-sm"
          onPress={() => navigate({ to: '/app/notifications' })}
          aria-label="Notifications"
        >
          <Icons.Bell className="text-white text-xl" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              <Text className="text-white text-[10px] font-bold font-bbh">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}


