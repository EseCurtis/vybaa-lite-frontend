import { BottomNotch, TopNotch } from '@/components/common/notch.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'

/**
 * Generic profile screen for the starter app.
 *
 * This avoids any real user data or backend calls and instead shows
 * how you might lay out a profile/account area.
 */
export default function ProfileScreen() {
  const { logout } = useAuth()
  return (
    <View className="flex-1 bg-black">
      <TopNotch />
      <TopNotch />

      <View className="flex-1 px-6 pb-[120px] pt-6 max-w-3xl mx-auto space-y-8">
        <View className="items-center space-y-3">
          <View className="rounded-full w-24 h-24 bg-card-700 border border-card-500 flex items-center justify-center">
            <Text className="text-white text-3xl font-bbh">AA</Text>
          </View>
          <View className="items-center space-y-1">
            <Text className="text-white text-2xl font-bbh font-bold">
              Example User
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              you@example.com
            </Text>
          </View>
        </View>

        <View className="space-y-3">
          <Text className="text-white/70 text-xs font-outfit uppercase tracking-[0.25em]">
            Overview
          </Text>
          <View className="bg-card-700 rounded-2xl p-4 border border-card-300/20">
            <Text className="text-white font-outfit font-semibold mb-1">
              Profile details
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              Use this screen to edit profile information, connect accounts, or
              show simple usage stats for your users.
            </Text>
          </View>
        </View>

        <Button label={'Logout'} onClick={logout}  textClassName='text-sm'/>
      </View>

      <BottomNotch />
    </View>
  )
}
