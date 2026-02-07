import { TopNotchPadd } from '@/components/common/notch.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { useToast } from '@/providers/toast.provider'
import { useModalController } from '@/providers/modal.provider'
import type { Goal } from '@/shared/api/goal.api'
import type { Achievement } from '@/shared/api/achievement.api'
import { AchievementModal } from '@/components/custom/achievement/achievement-modal.component'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { CreateGoalForm } from './components/create-goal-form.component'
import { CurrentGoalCard } from './components/current-goal-card.component'
import { EditGoalModal } from './components/edit-goal-modal.component'
import { GoalsList } from './components/goals-list.component'

export default function HomeAppScreen() {
  const toast = useToast()
  const modal = useModalController()
  const {
    goals,
    currentGoal,
    isLoading,
    isFetching,
    error,
    createGoalAsync,
    isCreating,
    checkInAsync,
    isCheckingIn,
    updateGoalAsync,
    isUpdating,
    deleteGoalAsync,
    isDeleting,
  } = useGoalOperations()

  const [isCreatingForm, setIsCreatingForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [formData, setFormData] = useState({
    goalText: '',
    targetDays: '',
    reminderTime: '',
  })
  const [editFormData, setEditFormData] = useState({
    goalText: '',
    targetDays: '',
    reminderTime: '',
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [loadingToastId, setLoadingToastId] = useState<string | null>(null)

  // Filter goals based on search query
  const filteredGoals = useMemo(() => {
    if (!searchQuery.trim()) return goals
    const query = searchQuery.toLowerCase()
    return goals.filter(
      (goal) =>
        goal.goalText.toLowerCase().includes(query) ||
        goal.currentDay.toString().includes(query) ||
        goal.targetDays.toString().includes(query)
    )
  }, [goals, searchQuery])

  // Show loading toast when creating
  useEffect(() => {
    if (isCreating) {
      const toastId = toast.loading('Creating goal...')
      setLoadingToastId(String(toastId))
      return () => {
        toast.dismiss(toastId)
        setLoadingToastId(null)
      }
    } else if (loadingToastId) {
      toast.dismiss(loadingToastId)
      setLoadingToastId(null)
    }
  }, [isCreating, toast, loadingToastId])

  // Show loading toast when checking in
  useEffect(() => {
    if (isCheckingIn) {
      const toastId = toast.loading('Checking in...')
      return () => toast.dismiss(toastId)
    }
  }, [isCheckingIn, toast])

  const handleCreateGoal = async () => {
    if (!formData.goalText.trim()) {
      const errorMsg = 'Goal text is required'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    const targetDays = parseInt(formData.targetDays, 10)
    if (!targetDays || targetDays < 1 || targetDays > 365) {
      const errorMsg = 'Target days must be between 1 and 365'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    try {
      setFormError(null)
      await createGoalAsync({
        goalText: formData.goalText.trim(),
        targetDays,
        reminderTime: formData.reminderTime || undefined,
      })
      setFormData({ goalText: '', targetDays: '', reminderTime: '' })
      setIsCreatingForm(false)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create goal'
      setFormError(errorMsg)
    }
  }

  const handleCheckIn = async (goalId?: string) => {
    try {
      const response = await checkInAsync(goalId)
      
      // Check if any achievements were earned
      const achievements = (response as any)?.data?.achievements as Achievement[] | undefined
      
      if (achievements && achievements.length > 0) {
        // Show achievement modal for each earned badge (one at a time)
        for (const achievement of achievements) {
          await new Promise<void>((resolve) => {
            modal.present(
              <AchievementModal
                achievement={achievement}
                onDismiss={() => {
                  modal.dismiss()
                  resolve()
                }}
              />,
              { dismissible: false }
            )
          })
        }
      }
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setEditFormData({
      goalText: goal.goalText,
      targetDays: goal.targetDays.toString(),
      reminderTime: goal.reminderTime || '',
    })
  }

  const handleUpdateGoal = async () => {
    if (!editingGoal) return

    if (!editFormData.goalText.trim()) {
      toast.warning('Goal text is required')
      return
    }

    const targetDays = parseInt(editFormData.targetDays, 10)
    if (!targetDays || targetDays < 1 || targetDays > 365) {
      toast.warning('Target days must be between 1 and 365')
      return
    }

    try {
      await updateGoalAsync(editingGoal.id, {
        goalText: editFormData.goalText.trim(),
        targetDays,
        reminderTime: editFormData.reminderTime || null,
      })
      setEditingGoal(null)
      setEditFormData({ goalText: '', targetDays: '', reminderTime: '' })
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return
    }

    try {
      await deleteGoalAsync(goalId)
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const loading = isLoading || isFetching

  return (
    <View className="flex-1 bg-cardd">
      <TopNotchPadd />
      <TopNotchPadd />

      <View className="flex-1 px-4 pb-[120px] pt-6 max-w-4xl mx-auto overflow-y-auto">
        {/* Minimal Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Text className="text-white text-4xl font-bbh font-bold tracking-tight">
            Lock In
          </Text>
        </motion.div>

        {/* Current Goal - Hero Card */}
        <CurrentGoalCard
          currentGoal={currentGoal!}
          isCheckingIn={isCheckingIn}
          loading={loading}
          onCheckIn={handleCheckIn}
        />

        {/* Quick Actions */}
        <CreateGoalForm
          isOpen={isCreatingForm}
          isCreating={isCreating}
          formData={formData}
          formError={formError}
          onClose={() => {
            setIsCreatingForm(!isCreatingForm)
            if (isCreatingForm) {
              setFormData({ goalText: '', targetDays: '', reminderTime: '' })
              setFormError(null)
            }
          }}
          onFormChange={(data) => {
            setFormData(data)
            setFormError(null)
          }}
          onSubmit={handleCreateGoal}
        />

        {/* Goals List - Compact & Slick */}
        <GoalsList
          goals={goals}
          filteredGoals={filteredGoals}
          currentGoal={currentGoal!}
          searchQuery={searchQuery}
          isCheckingIn={isCheckingIn}
          isUpdating={isUpdating}
          isDeleting={isDeleting}
          onSearchChange={setSearchQuery}
          onCheckIn={handleCheckIn}
          onEdit={handleEditGoal}
          onDelete={handleDeleteGoal}
        />

        {/* Edit Goal Modal */}
        <EditGoalModal
          editingGoal={editingGoal}
          isUpdating={isUpdating}
          editFormData={editFormData}
          onClose={() => {
            setEditingGoal(null)
            setEditFormData({ goalText: '', targetDays: '', reminderTime: '' })
          }}
          onFormChange={setEditFormData}
          onSubmit={handleUpdateGoal}
        />
      </View>
    </View>
  )
}
