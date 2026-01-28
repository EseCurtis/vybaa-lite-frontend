import { BottomNotch, TopNotch } from '@/components/common/notch.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

/**
 * Generic settings screen for the starter app.
 *
 * This is intentionally minimal and does not include:
 * - auth/logout flows
 * - profile management or password change flows
 *
 * Use it as a scaffold for your own settings.
 */
export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-black">
      <TopNotch />

      <View className="pt-8 pb-6 px-6 flex-1 max-w-3xl mx-auto">
        <View className="mb-8">
          <Text className="text-white text-xl font-bold font-bbh">
            Settings
          </Text>
          <Text className="text-white/60 text-sm font-outfit mt-1">
            Wire up your own preferences, themes, and account options here.
          </Text>
        </View>

        <View className="gap-4">
          <View className="bg-card-700 rounded-xl p-4 border border-card-300/20">
            <Text className="text-white font-outfit font-semibold mb-1">
              Theme
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              Example placeholder for light/dark or accent color controls.
            </Text>
          </View>

          <View className="bg-card-700 rounded-xl p-4 border border-card-300/20">
            <Text className="text-white font-outfit font-semibold mb-1">
              Notifications
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              Use this section to configure push, email, or in-app notifications.
            </Text>
          </View>
        </View>
      </View>

      <BottomNotch />
    </View>
  )
}
