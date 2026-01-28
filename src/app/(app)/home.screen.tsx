import { TopNotchPadd } from '@/components/common/notch.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

/**
 * Generic home screen for the starter app.
 *
 * This intentionally avoids:
 * - auth state
 * - tasks, journals or other product-specific concepts
 *
 * Treat it as a canvas for your primary experience.
 */
export default function HomeAppScreen() {
  return (
    <View className="flex-1 bg-black">
      <TopNotchPadd />
      <TopNotchPadd />

      <View className="flex-1 px-5 pb-[120px] pt-4 space-y-6 max-w-4xl mx-auto">
        <View className="space-y-2">
          <Text className="text-white/70 text-xs font-outfit uppercase tracking-[0.2em]">
            Home
          </Text>
          <Text className="text-white text-3xl md:text-4xl font-bbh font-bold leading-tight">
            This is your new starting point.
          </Text>
          <Text className="text-white/70 text-sm md:text-base font-outfit max-w-xl">
            Replace this section with your core product experience. The layout, theming,
            and navigation are already wired up for web + mobile.
          </Text>
        </View>

        <View className="grid gap-4 md:grid-cols-2 mt-4">
          <View className="bg-card-700 rounded-2xl p-4 border border-card-300/20">
            <Text className="text-white font-outfit font-semibold mb-1">
              Example card
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              Use cards like this to highlight key information, stats, or quick actions.
            </Text>
          </View>

          <View className="bg-card-700 rounded-2xl p-4 border border-card-300/20">
            <Text className="text-white font-outfit font-semibold mb-1">
              Mobile-first
            </Text>
            <Text className="text-white/60 text-sm font-outfit">
              The layout is tuned for mobile screens but stretches gracefully to desktop.
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
