import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export function HomeGreetings({ userName }: { userName: string }) {
  return (
    <View className="py-mg px-mg">
      <Text className="text-card-lighter/50 font-bold text-3xl">
        Hi <Text className="">{userName}</Text>, <br />
        <Text className="text-card-lighter-2"> What are we doing today?</Text>
      </Text>
    </View>
  )
}
