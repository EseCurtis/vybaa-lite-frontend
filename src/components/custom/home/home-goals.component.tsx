import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { normalizePages, seededColor, smartTruncate } from '@/shared/utils/helpers.util'
import { RiArrowRightUpLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { GoalDurationPill } from '../goal/duration-pill.component'
import { GoalDetailsSheet } from '../goal/goal-details-sheet.component'

function HomeGoalItem({
  title,
  currentDay,
  targetDays,
  onOpen
}: {
  title: string
  currentDay: number
  targetDays: number
  onOpen: () => void
}) {
  const color = seededColor(title)
  return (
    <Pressable
      style={{
        backgroundColor: color,
      }}
      onPress={onOpen}
      className=" snap-center  max-w-[97%] flex-row gap-3 items-center font-bold rounded-full p-2  pr-4 shrink-0"
    >
      <GoalDurationPill currentDay={currentDay} targetDays={targetDays} />
      <Text className="text-black/40 limit-text-to-two-lines  leading-tight text-sm max-w-[80vw] text-ellipsis overflow-hidden  text-left ">{smartTruncate(title,23)}</Text>
      <View className="">
        <RiArrowRightUpLine size={27} />
      </View>
    </Pressable>
  )
}

export function HomeGoals() {
  const bottomSheet = useBottomSheet()
  const navigate = useNavigate()
  const { hasNextPage, data } = useInfiniteGoals({ canCheckIn: true })
  const goals = normalizePages(data?.pages || [])
  const noGoals = goals.length == 0

  const handleGoalClick = (goal: Goal) => {
    bottomSheet.present(
      <GoalDetailsSheet goal={goal} onDismiss={bottomSheet.dismiss} />,
      { title: 'Goal Details', elevation: 9999 },
    )
  }

  return (
    <View className="overflow-x-scroll snap-x snap-mandatory flex-row px-mg shrink-0 no-scrollbar ">
      {goals.map((goal, index) => {
        return (
          <HomeGoalItem
            key={index}
            title={goal.goalText}
            currentDay={goal.currentDay}
            targetDays={goal.targetDays}
            onOpen={() => {
              handleGoalClick(goal)
            }}
          />
        )
      })}

      {!noGoals && (
        <Pressable
          onPress={() => {
            navigate({ to: '/app/goal' })
          }}
          className="snap-center ml-2 text-card-lighter-3  bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-4 font-bold"
        >
          <Text className="whitespace-nowrap text-sm">See all</Text>
        </Pressable>
      )}

      {noGoals && (
        <View className="flex-row w-full items-center">
          <Text className="text-card-lighter-2/50 font-medium">You cleared it all! 🎊</Text>
          <Pressable
            onPress={() => {
              navigate({ to: '/app/goal' })
            }}
            className="snap-center bg-white ml-2 text-black ml-auto  rounded-full flex-row gap-2 items-center justify-center px-4  py-3 font-bold"
          >
            <Text className="whitespace-nowrap text-sm">See all goals</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
