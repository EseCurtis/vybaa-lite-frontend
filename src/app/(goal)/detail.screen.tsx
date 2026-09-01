import { NoiseComponent } from '@/components/common/noise.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { GoalDetailsSheet } from '@/components/custom/goal/goal-details-sheet.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoal } from '@/hooks/use-goals.hook'
import { colors } from '@/shared/colors.shared'
import { useNavigate, useParams } from '@tanstack/react-router'
import { RiRefreshLine } from '@remixicon/react'

export default function GoalDetailScreen() {
  const navigate = useNavigate()
  const { goalId } = useParams({ from: '/app/goal/$goalId' })
  const goal = useGoal(goalId)

  return (
    <View className="flex-1" style={{ backgroundColor: colors.cardd }}>
      <NoiseComponent>
        <TabHeader
          canGoBack
          onBack={() => navigate({ replace: true, to: '/app/goal' })}
          title="Goal details"
        />
        <View className="flex-1 overflow-y-auto px-mg pb-[120px]">
          <View className="mx-auto w-full max-w-3xl">
            {goal.isLoading ? (
              <View className="gap-4 py-4">
                <Skeleton className="h-40 w-full" rounded="xl" />
                <Skeleton className="h-28 w-full" rounded="xl" />
                <Skeleton className="h-64 w-full" rounded="xl" />
              </View>
            ) : goal.isError ? (
              <View className="gap-4 rounded-[24px] bg-card-light-50 px-4 py-5">
                <Text className="text-base font-bold">
                  Could not open this goal
                </Text>
                <Text className="text-sm leading-6 text-card-lighter-2">
                  {goal.error instanceof Error
                    ? goal.error.message
                    : 'Try refreshing the goal.'}
                </Text>
                <Button
                  label="Retry"
                  leftIcon={<RiRefreshLine size={18} />}
                  onClick={() => void goal.refetch()}
                  variant="secondary"
                />
              </View>
            ) : goal.data ? (
              <GoalDetailsSheet
                goal={goal.data}
                onDismiss={() => navigate({ replace: true, to: '/app/goal' })}
              />
            ) : null}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
