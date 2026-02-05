import { TopNotch } from '@/components/common/notch.component'
import { HomeActions } from '@/components/home/home-actions.component'
import { HomeGoals } from '@/components/home/home-goals.component'
import { HomeGreetings } from '@/components/home/home-greetings.component'
import { HomeHeader } from '@/components/home/home-header.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { cn } from '@/shared/utils/helpers.util'

export function Home2Screen() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <View className="bg-cardd flex-1">
      <TopNotch />
      <HomeHeader user={user} />
      <HomeGreetings userName={cn(user.firstName, user.lastName)} />
      <HomeGoals />
      <HomeActions />
    </View>
  )
}
