import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { HomeInsight } from './home-insight'

export function HomeProgress({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  if (total <= 0) return null
  const pct = Math.round((completed / total) * 100)
  return (
    <View className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] mb-6 pb-0">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-white text-sm font-bbh-mini">
          Today's Progress
        </Text>
        <Text className="text-white/70 text-sm font-bbh-mini !origin-right ">
          {completed}/{total} completed
        </Text>
      </View>
      <View className="bg-[#111111] rounded-full h-2">
        <View
          className="bg-white rounded-full h-2 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </View>

      <HomeInsight
        text={
          completed === total && total > 0
            ? "You're absolutely crushing it today! 🔥"
            : "You've been keeping it real \n 🔥 keep going."
        }
      />
    </View>
  )
}
