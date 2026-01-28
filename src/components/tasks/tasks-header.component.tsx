import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'

export interface TasksHeaderProps {
  onAdd: () => void
}

export function TasksHeader({ onAdd }: TasksHeaderProps) {
  return (
    <View className="flex-row items-center justify-between p-mg pb-0">
      <Text className="text-lg font-bold font-bbh text-white">Tasks</Text>
      <TouchableOpacity onPress={onAdd} className="px-3 py-1 bg-white rounded-full hidden">
        <Text className="text-black font-semibold">+ New Task</Text>
      </TouchableOpacity>
    </View>
  )
}






