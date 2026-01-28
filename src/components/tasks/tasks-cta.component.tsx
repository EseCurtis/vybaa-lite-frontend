import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export interface TasksCtaProps {
  onPress: () => void
}

export function TasksCta({ onPress }: TasksCtaProps) {
  return (
    <View className="items-center mt-8">
      <TouchableOpacity onPress={onPress} className="bg-yellow-500 px-8 py-3 rounded-2xl">
        <Text className="text-white font-bold">Quick Action</Text>
      </TouchableOpacity>
    </View>
  )
}






