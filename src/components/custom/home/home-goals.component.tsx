import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import type { Goal } from '@/shared/api/goal.api'
import { seededColor, smartTruncate } from '@/shared/utils/helpers.util'
import {
  RiAddCircleFill,
  RiArrowRightCircleFill,
  RiArrowRightUpLine,
} from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { GoalDurationPill } from '../goal/duration-pill.component'

function HomeGoalItem({
  title,
  currentDay,
  targetDays,
  onOpen,
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
      <Text className="text-black/40 limit-text-to-two-lines  leading-tight text-sm max-w-[80vw] text-ellipsis overflow-hidden  text-left ">
        {smartTruncate(title, 23)}
      </Text>
      <View className="">
        <RiArrowRightUpLine size={27} />
      </View>
    </Pressable>
  )
}

export function HomeGoals() {
  const navigate = useNavigate()
  const { data } = useInfiniteGoals({ filter: 'DUE' })
  const goals = data?.pages.flatMap((page) => page.data) ?? []
  const noGoals = goals.length == 0

  const handleGoalClick = (goal: Goal) => {
    navigate({ to: '/app/goal/$goalId', params: { goalId: goal.id } })
  }

  const handleCreateGoal = () => {
    navigate({ to: '/app/goal/create' })
  }

  return (
    <View className="pt-mg">
      <View className="overflow-x-scroll bg-cardd py-3 rounded-full snap-x snap-mandatory flex-row  px-mg shrink-0 no-scrollbar  ">
        {goals.map((goal, index) => {
          return (
            <HomeGoalItem
              key={index}
              title={goal.title}
              currentDay={goal.progress.completedOccurrences}
              targetDays={
                goal.target.type === 'CHECK_IN_COUNT'
                  ? goal.target.count
                  : Math.max(1, Math.round(goal.progress.value || 1))
              }
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
            <Text className="text-card-lighter-2/50 font-mona-sans-x font-medium">
              Clean slate, mate!
            </Text>

            <Pressable
              onPress={() => {
                handleCreateGoal()
              }}
              className="snap-center bg-purple-500 ml-2 ml-auto !p-3 text-black rounded-full flex-row gap-2 items-center justify-center px-4  py-3 font-bold"
            >
              <RiAddCircleFill />
            </Pressable>
            <Pressable
              onPress={() => {
                navigate({ to: '/app/goal' })
              }}
              className="snap-center bg-warning-yellow ml-2 !pr-2 text-black   rounded-full flex-row gap-2 items-center justify-center px-4  py-3 font-bold"
            >
              <Text className="whitespace-nowrap text-sm">Goals</Text>
              <RiArrowRightCircleFill />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}
