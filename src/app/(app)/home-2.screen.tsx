import { NoiseComponent } from '@/components/common/noise.component'
import {
  BottomNotchWithTab,
  TopNotch,
} from '@/components/common/notch.component'
import { HomeActions } from '@/components/custom/home/home-actions.component'
import { HomeGoals } from '@/components/custom/home/home-goals.component'
import { HomeGreetings } from '@/components/custom/home/home-greetings.component'
import { HomeHeader } from '@/components/custom/home/home-header.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'

export function Home2Screen() {
  const { user } = useAuth()

  if (!user) return null

  const userName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.email

  return (
    <View className="bg-cardd flex-1 overflow-y-scroll">
      <NoiseComponent>
        <View className="bg-cardd flex flex-col rounded-b-[30px]">
          <TopNotch />
          <HomeHeader user={user} />
          <HomeGoals />
        </View>
        <HomeGreetings
          rewindPersona={user.rewindPersona}
          userName={userName}
        />

       <View className="bg-cardd flex flex-col rounded-t-[40px]">
         <HomeActions />
        <BottomNotchWithTab />
       </View>
      </NoiseComponent>
    </View>
  )
}
