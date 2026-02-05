import { TabHeader } from '@/components/common/tab-header.component'
import { GoalList } from '@/components/custom/goal/goal-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import { RiEditBoxLine } from '@remixicon/react'

export default function GoalsAppScreen() {
  
  return (
    <View className=" flex-1 bg-cardd">
      <TabHeader title="My Goals">
        <Pressable
          onPress={() => {
            
          }}
          className="text-white"
        >
          <RiEditBoxLine />
        </Pressable>
      </TabHeader>

      <GoalList  />
    </View>
  )
}
