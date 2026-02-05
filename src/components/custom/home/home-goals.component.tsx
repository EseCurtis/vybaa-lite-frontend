import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useInfiniteGoals } from '@/hooks/use-goals.hook'
import { normalizePages, seededColor } from '@/shared/utils/helpers.util'
import { RiArrowRightUpLine } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'

function HomeGoalItem({
  title,
  currentDay,
  targetDays,
}: {
  title: string
  currentDay: number
  targetDays: number
}) {
  const color = seededColor(title)
  return (
    <View
      style={{
        backgroundColor: color,
      }}
      className=" snap-center max-w-[97%] flex-row gap-3 items-center font-bold rounded-full p-2  pr-4 shrink-0"
    >
      <View className=" bg-black/20 p-2  items-center justify-center rounded-full">
        <Text className="text-black/30 text-sm">
          Day {currentDay} of {targetDays}
        </Text>
      </View>
      <Text className="text-black/40 leading-tight text-sm">{title}</Text>
      <View className="">
        <RiArrowRightUpLine size={27} />
      </View>
    </View>
  )
}

export function HomeGoals() {
  const navigate = useNavigate()
  const { hasNextPage, data } = useInfiniteGoals({ canCheckIn: true })
  const goals = normalizePages(data?.pages || [])
  const noGoals = goals.length == 0

  return (
    <View className="overflow-x-scroll snap-x snap-mandatory flex-row px-mg shrink-0 no-scrollbar ">
      {goals.map((goal, index) => {
        return (
          <HomeGoalItem
            key={index}
            title={goal.goalText}
            currentDay={goal.currentDay}
            targetDays={goal.targetDays}
          />
        )
      })}

      {hasNextPage && (
        <Pressable
          onPress={() => {
            navigate({ to: '/goal' })
          }}
          className="snap-center ml-2 text-card-lighter-3  bg-card-light/20 rounded-full flex-row gap-2 items-center justify-center px-4 font-bold"
        >
          <Text className="whitespace-nowrap text-sm">See all</Text>
        </Pressable>
      )}

      {noGoals && (
        <View className="flex-row w-full items-center">
          <Text className="text-card-lighter-2">You cleared it all! 🎊</Text>
          <Pressable
            onPress={() => {
              navigate({ to: '/goal' })
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
