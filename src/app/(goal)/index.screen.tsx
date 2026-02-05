import { TabHeader } from '@/components/common/tab-header.component'
import { GoalList } from '@/components/custom/goal/goal-list.component'
import { View } from '@/components/layout/view.component'

export default function GoalsAppScreen() {
  return (
    <View className=" flex-1 bg-cardd">
      <TabHeader title="My Goals" />

      <GoalList />
    </View>
  )
}
