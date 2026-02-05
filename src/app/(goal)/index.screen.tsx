import { TabHeader } from '@/components/common/tab-header.component'
import { CreateGoalSheet } from '@/components/custom/goal/create-goal-sheet.component'
import { GoalDetailsSheet } from '@/components/custom/goal/goal-details-sheet.component'
import { GoalList } from '@/components/custom/goal/goal-list.component'
import { Pressable } from '@/components/layout/pressables.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Goal } from '@/shared/api/goal.api'
import { RiEditBoxLine } from '@remixicon/react'

export default function GoalsAppScreen() {
  const bottomSheet = useBottomSheetController()

  const handleCreateGoal = () => {
    bottomSheet.present(<CreateGoalSheet onSuccess={bottomSheet.dismiss} />, {
      title: 'New Goal',
    })
  }

  const handleGoalClick = (goal: Goal) => {
    bottomSheet.present(
      <GoalDetailsSheet goal={goal} onDismiss={bottomSheet.dismiss} />,
      { title: 'Goal Details' },
    )
  }

  return (
    <View className=" flex-1 bg-cardd overflow-y-auto no-scrollbar">
      <TabHeader title="Goals">
        <Pressable onPress={handleCreateGoal} className="text-white">
          <RiEditBoxLine />
        </Pressable>
      </TabHeader>

      <GoalList onGoalClick={handleGoalClick} onCreateGoal={handleCreateGoal} />
    </View>
  )
}
