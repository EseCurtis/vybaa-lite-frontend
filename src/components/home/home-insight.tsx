import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export function HomeInsight({ text }: { text: string }) {
  if (!text) return null
  return (
    <View className="bg-grasdient-to-r my-3 from-transparent via-accent-400/20 to-transparent  ">
      <Text className="text-white text-xl font-bold font-outfit font-bbh-mini-2">
        {text}
      </Text>
    </View>
  )
}
