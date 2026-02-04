import { Input } from '@/components/common/input.component'
import { TopNotchPadd } from '@/components/common/notch.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Icon, Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { useToast } from '@/providers/toast.provider'
import { cn } from '@/shared/utils/helpers.util'
import { useState, useEffect, useMemo } from 'react'
import type { Goal } from '@/shared/api/goal.api'

export default function HomeAppScreen() {
  const toast = useToast()
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
  })
  const [editFormData, setEditFormData] = useState({
    goalText: '',
    targetDays: '',
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
      setLoadingToastId(toastId)
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
      })
      setFormData({ goalText: '', targetDays: '' })
      setIsCreatingForm(false)
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create goal'
      setFormError(errorMsg)
      // Error toast is already shown in the mutation hook
    }
  }

  const handleCheckIn = async (goalId?: string) => {
    try {
      await checkInAsync(goalId)
      // Success toast is already shown in the mutation hook
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setEditFormData({
      goalText: goal.goalText,
      targetDays: goal.targetDays.toString(),
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
      })
      setEditingGoal(null)
      setEditFormData({ goalText: '', targetDays: '' })
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
      // Success toast is already shown in the mutation hook
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const loading = isLoading || isFetching

  return (
    <View className="flex-1 bg-black">
      <TopNotchPadd />
      <TopNotchPadd />

      <View className="flex-1 px-5 pb-[120px] pt-4 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <View className="space-y-2">
          <Text className="text-white/70 text-xs font-bbh uppercase tracking-[0.2em]">
            Lock In
          </Text>
          <Text className="text-white text-3xl md:text-4xl font-bbh font-bold leading-tight">
            Your Commitment
          </Text>
        </View>

        {/* Current Goal Display */}
        {currentGoal ? (
          <View className="space-y-4">
            <View className="bg-card-700 rounded-2xl p-6 border border-card-300/20">
              <View className="space-y-4">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-white/70 text-sm font-bbh uppercase tracking-wide">
                    Day {currentGoal.currentDay} of {currentGoal.targetDays}
                  </Text>
                  <View className="bg-white/10 rounded-full px-3 py-1">
                    <Text className="text-white text-2xl font-bold font-bbh">
                      {currentGoal.currentDay}
                    </Text>
                  </View>
                </View>

                <Text className="text-white text-lg font-bbh leading-relaxed">
                  {currentGoal.goalText}
                </Text>

                <View className="pt-4 border-t border-card-500/30">
                  <Button
                    label="I showed up today"
                    variant="default"
                    fullWidth
                    onClick={() => handleCheckIn(currentGoal.id)}
                    disabled={isCheckingIn || loading}
                    loading={isCheckingIn}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-card-700 rounded-2xl p-6 border border-card-300/20">
            {loading ? (
              <Text className="text-white/70 text-center font-bbh">
                Loading...
              </Text>
            ) : (
              <Text className="text-white/70 text-center font-bbh">
                No active goal. Create one to get started.
              </Text>
            )}
          </View>
        )}

        {/* Create Goal Section - Always available */}
        {!loading && (
          <View className="space-y-4">
            {!isCreatingForm ? (
              <Button
                label="Create New Goal"
                variant="secondary"
                fullWidth
                onClick={() => setIsCreatingForm(true)}
              />
            ) : (
              <View className="bg-card-700 rounded-2xl p-6 border border-card-300/20 space-y-4">
                <Text className="text-white text-xl font-bbh font-semibold">
                  Create Your Goal
                </Text>

                <View className="space-y-4">
                  <View>
                    <TextArea
                      placeholder="For the next X days, I will..."
                      value={formData.goalText}
                      onChange={(e) => {
                        setFormData({ ...formData, goalText: e.target.value })
                        setFormError(null)
                      }}
                      className="min-h-[100px]"
                      maxLength={500}
                    />
                  </View>

                  <View>
                    <Input
                      type="number"
                      placeholder="Number of days (1-365)"
                      value={formData.targetDays}
                      onChange={(e) => {
                        setFormData({ ...formData, targetDays: e.target.value })
                        setFormError(null)
                      }}
                      className="bg-card-600 border border-card-500"
                      min={1}
                      max={365}
                    />
                  </View>

                  {formError && (
                    <Text className="text-danger-500 text-sm font-bbh">
                      {formError}
                    </Text>
                  )}

                  <View className="flex flex-row gap-3">
                    <Button
                      label="Cancel"
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setIsCreatingForm(false)
                        setFormData({ goalText: '', targetDays: '' })
                        setFormError(null)
                      }}
                    />
                    <Button
                      label="Start Goal"
                      variant="default"
                      fullWidth
                      onClick={handleCreateGoal}
                      disabled={isCreating}
                      loading={isCreating}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Goals List */}
        {goals.length > 0 && (
          <View className="space-y-4">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-white/70 text-sm font-bbh uppercase tracking-wide">
                All Goals ({goals.length})
              </Text>
            </View>

            {/* Search Input */}
            <View className="relative">
              <Icons.Search
                size="sm"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              />
              <Input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card-600 border border-card-500 pl-10"
              />
            </View>

            <View className="space-y-3">
              {filteredGoals.length === 0 ? (
                <View className="bg-card-700 rounded-xl p-6 border border-card-300/20">
                  <Text className="text-white/70 text-center font-bbh">
                    No goals found matching "{searchQuery}"
                  </Text>
                </View>
              ) : (
                filteredGoals.map((goal) => (
                <View
                  key={goal.id}
                  className={cn(
                    'bg-card-700 rounded-xl p-4 border border-card-300/20',
                    goal.id === currentGoal?.id && 'border-white/40'
                  )}
                >
                  <View className="space-y-3">
                    <View className="flex flex-row items-start justify-between gap-2">
                      <View className="flex-1 space-y-2">
                        <Text className="text-white font-bbh text-sm leading-relaxed">
                          {goal.goalText}
                        </Text>
                        <View className="flex flex-row items-center gap-4">
                          <Text className="text-white/60 text-xs font-bbh">
                            Day {goal.currentDay}/{goal.targetDays}
                          </Text>
                          {goal.lastCheckInDate && (
                            <Text className="text-white/40 text-xs font-bbh">
                              Last: {new Date(goal.lastCheckInDate).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                      </View>
                      <View className="flex flex-row items-center gap-2">
                        {goal.id === currentGoal?.id && (
                          <View className="bg-white/20 rounded-full px-2 py-1">
                            <Text className="text-white text-xs font-bbh font-semibold">
                              Active
                            </Text>
                          </View>
                        )}
                        <button
                          onClick={() => handleEditGoal(goal)}
                          className="p-2 hover:bg-card-600 rounded-lg transition-colors"
                          disabled={isUpdating || isDeleting}
                        >
                          <Icons.Edit size="sm" color="#ffffff" />
                        </button>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="p-2 hover:bg-danger-500/20 rounded-lg transition-colors"
                          disabled={isUpdating || isDeleting}
                        >
                          <Icons.Trash size="sm" color="#EF4444" />
                        </button>
                      </View>
                    </View>
                    <Button
                      label="Check In"
                      variant="outline"
                      size="sm"
                      fullWidth
                      onClick={() => handleCheckIn(goal.id)}
                      disabled={isCheckingIn || isDeleting}
                      loading={isCheckingIn}
                    />
                  </View>
                </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* Edit Goal Modal */}
        {editingGoal && (
          <View className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/70 p-4">
            <View className="bg-card-700 rounded-2xl p-6 border border-card-300/20 w-full max-w-md space-y-4">
              <View className="flex flex-row items-center justify-between">
                <Text className="text-white text-xl font-bbh font-semibold">
                  Edit Goal
                </Text>
                <button
                  onClick={() => {
                    setEditingGoal(null)
                    setEditFormData({ goalText: '', targetDays: '' })
                  }}
                  className="p-2 hover:bg-card-600 rounded-lg transition-colors"
                >
                  <Icons.X size="sm" color="#ffffff" />
                </button>
              </View>

              <View className="space-y-4">
                <View>
                  <TextArea
                    placeholder="For the next X days, I will..."
                    value={editFormData.goalText}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, goalText: e.target.value })
                    }}
                    className="min-h-[100px]"
                    maxLength={500}
                  />
                </View>

                <View>
                  <Input
                    type="number"
                    placeholder="Number of days (1-365)"
                    value={editFormData.targetDays}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, targetDays: e.target.value })
                    }}
                    className="bg-card-600 border border-card-500"
                    min={1}
                    max={365}
                  />
                </View>

                <View className="flex flex-row gap-3">
                  <Button
                    label="Cancel"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setEditingGoal(null)
                      setEditFormData({ goalText: '', targetDays: '' })
                    }}
                  />
                  <Button
                    label="Save Changes"
                    variant="default"
                    fullWidth
                    onClick={handleUpdateGoal}
                    disabled={isUpdating}
                    loading={isUpdating}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View className="bg-danger-500/20 border border-danger-500 rounded-xl p-4">
            <Text className="text-danger-500 text-sm font-bbh">
              {error instanceof Error ? error.message : 'An error occurred'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
