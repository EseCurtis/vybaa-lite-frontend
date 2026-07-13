import { NoiseComponent } from '@/components/common/noise.component'
import { TopNotch } from '@/components/common/notch.component'
import { PullToRefresh } from '@/components/common/pull-to-refresh.component'
import { CreateGoalSheet } from '@/components/custom/goal/create-goal-sheet.component'
import { GoalDetailsSheet } from '@/components/custom/goal/goal-details-sheet.component'
import { GoalList } from '@/components/custom/goal/goal-list.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import { useToast } from '@/providers/toast.provider'
import type { Goal } from '@/shared/api/goal.api'
import { goalAPI } from '@/shared/api/goal.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { insightsQueryKeys } from '@/shared/api/insights.query-keys'
import { randomGreetings } from '@/shared/goal/goal.util.shared'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

export default function GoalsAppScreen() {
  const bottomSheet = useBottomSheetController()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { user} = useAuth();

  const [bulkMode, setBulkMode] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCreateGoal = () => {
    bottomSheet.present(<CreateGoalSheet onSuccess={bottomSheet.dismiss} />, {
      title:randomGreetings(user?.username),
      elevation: 999,
      size: 'semi-full',
    })
  }

  //$ 

  const handleGoalClick = (goal: Goal) => {
    if (bulkMode) {
      // Toggle selection
      setSelectedGoals((prev) => {
        const next = new Set(prev)
        if (next.has(goal.id)) {
          next.delete(goal.id)
        } else {
          next.add(goal.id)
        }
        return next
      })
    } else {
      // Normal click - show details
      bottomSheet.present(
        <GoalDetailsSheet goal={goal} onDismiss={bottomSheet.dismiss} />,
        { title: 'Goal Details', elevation: 9999 },
      )
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.all }),
        queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode)
    setSelectedGoals(new Set()) // Clear selections when toggling
  }

  const handleBulkDelete = async () => {
    if (selectedGoals.size === 0) {
      toast.warning('No goals selected')
      return
    }

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedGoals.size} goal(s)? This cannot be undone.`,
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const goalIds = Array.from(selectedGoals)
      const response = await goalAPI.bulkDeleteGoals(goalIds)

      // Show summary message from backend
      toast.success(response.msg)

      // Reset state
      setSelectedGoals(new Set())
      setBulkMode(false)
      await handleRefresh()
    } catch (error: any) {
      toast.error(error.response?.data?.msg || 'Failed to delete goals')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <View className=" flex-1 bg-cardd">
      <TopNotch/>
      <NoiseComponent>
        <PullToRefresh
          className="flex-1 overflow-y-auto no-scrollbar"
          onRefresh={handleRefresh}
          refreshing={isRefreshing}
        >
          <GoalList
            onGoalClick={handleGoalClick}
            onCreateGoal={handleCreateGoal}
            bulkMode={bulkMode}
            selectedGoals={selectedGoals}
            actions={{
              handleRefresh,
              handleBulkDelete,
              handleCreateGoal,
              toggleBulkMode,
            }}
            states={{
              isDeleting,
            }}
            onToggleSelection={(goalId) => {
              setSelectedGoals((prev) => {
                const next = new Set(prev)
                if (next.has(goalId)) {
                  next.delete(goalId)
                } else {
                  next.add(goalId)
                }
                return next
              })
            }}
          />
        </PullToRefresh>
      </NoiseComponent>
    </View>
  )
}
