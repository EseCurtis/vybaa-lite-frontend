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
import { motion, AnimatePresence } from 'framer-motion'

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

  // Calculate progress percentage
  const progressPercentage = currentGoal
    ? Math.min((currentGoal.currentDay / currentGoal.targetDays) * 100, 100)
    : 0

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
    }
  }

  const handleCheckIn = async (goalId?: string) => {
    try {
      await checkInAsync(goalId)
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
    } catch (err: any) {
      // Error toast is already shown in the mutation hook
    }
  }

  const loading = isLoading || isFetching

  return (
    <View className="flex-1 bg-black">
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
        {currentGoal ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className="mb-6"
          >
            <View className="bg-gradient-to-br from-card-700 via-card-700 to-card-800 rounded-3xl p-6 border border-white/5 overflow-hidden relative">
              {/* Progress Ring Background */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white"
                  />
                  <motion.circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="text-white"
                    strokeDasharray={`${2 * Math.PI * 45}%`}
                    initial={{ strokeDashoffset: `${2 * Math.PI * 45}%` }}
                    animate={{
                      strokeDashoffset: `${2 * Math.PI * 45 * (1 - progressPercentage / 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </svg>
              </div>

              <View className="relative z-10 space-y-5">
                {/* Day Counter - Big & Bold */}
                <View className="flex items-center justify-center">
                  <motion.div
                    key={currentGoal.currentDay}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-center"
                  >
                    <Text className="text-white text-7xl font-bbh font-bold leading-none">
                      {currentGoal.currentDay}
                    </Text>
                    <Text className="text-white/50 text-sm font-bbh mt-1">
                      of {currentGoal.targetDays} days
                    </Text>
                  </motion.div>
                </View>

                {/* Goal Text */}
                <View className="text-center">
                  <Text className="text-white/90 text-lg font-bbh leading-relaxed">
                    {currentGoal.goalText}
                  </Text>
                </View>

                {/* Progress Bar */}
                <View className="space-y-2">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-white/30 to-white/50 rounded-full"
                    />
                  </div>
                  <Text className="text-white/40 text-xs font-bbh text-center">
                    {Math.round(progressPercentage)}% complete
                  </Text>
                </View>

                {/* Quick Check-In Button */}
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Button
                    label="✓ Check In"
                    variant="default"
                    fullWidth
                    onClick={() => handleCheckIn(currentGoal.id)}
                    disabled={isCheckingIn || loading}
                    loading={isCheckingIn}
                    className="text-lg font-bold"
                  />
                </motion.div>
              </View>
            </View>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <View className="bg-card-700/50 rounded-3xl p-8 border border-white/5 text-center">
              <Text className="text-white/40 text-sm font-bbh">
                No active goal
              </Text>
            </View>
          </motion.div>
        )}

        {/* Quick Actions */}
        <AnimatePresence mode="wait">
          {!isCreatingForm ? (
            <motion.div
              key="create-button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button
                  label="+ New Goal"
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsCreatingForm(true)}
                  className="text-base"
                />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <View className="bg-card-700/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 space-y-4">
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bbh font-bold">
                    New Goal
                  </Text>
                  <button
                    onClick={() => {
                      setIsCreatingForm(false)
                      setFormData({ goalText: '', targetDays: '' })
                      setFormError(null)
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Icons.X size="sm" color="#ffffff" />
                  </button>
                </View>

                <View className="space-y-4">
                  <View>
                    <TextArea
                      placeholder="What's your commitment?"
                      value={formData.goalText}
                      onChange={(e) => {
                        setFormData({ ...formData, goalText: e.target.value })
                        setFormError(null)
                      }}
                      className="min-h-[80px] bg-card-600/50 border-white/10"
                      maxLength={500}
                    />
                  </View>

                  <View>
                    <Input
                      type="number"
                      placeholder="Days (1-365)"
                      value={formData.targetDays}
                      onChange={(e) => {
                        setFormData({ ...formData, targetDays: e.target.value })
                        setFormError(null)
                      }}
                      className="bg-card-600/50 border-white/10"
                      min={1}
                      max={365}
                    />
                  </View>

                  {formError && (
                    <Text className="text-danger-500 text-sm font-bbh">
                      {formError}
                    </Text>
                  )}

                  <Button
                    label="Start"
                    variant="default"
                    fullWidth
                    onClick={handleCreateGoal}
                    disabled={isCreating}
                    loading={isCreating}
                  />
                </View>
              </View>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals List - Compact & Slick */}
        {goals.length > 0 && (
          <View className="space-y-4">
            {/* Search - Minimal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <View className="relative">
                <Icons.Search
                  size="sm"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 z-10"
                />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card-700/50 border-white/5 pl-10 backdrop-blur-sm"
                />
              </View>
            </motion.div>

            {/* Goals Grid */}
            <View className="space-y-2">
              <AnimatePresence>
                {filteredGoals.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <View className="bg-card-700/30 rounded-2xl p-6 border border-white/5 text-center">
                      <Text className="text-white/40 text-sm font-bbh">
                        No matches
                      </Text>
                    </View>
                  </motion.div>
                ) : (
                  filteredGoals.map((goal, index) => {
                    const isActive = goal.id === currentGoal?.id
                    const goalProgress = (goal.currentDay / goal.targetDays) * 100

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <View
                          className={cn(
                            'bg-card-700/60 backdrop-blur-sm rounded-2xl p-4 border transition-all',
                            isActive
                              ? 'border-white/30 bg-card-700/80'
                              : 'border-white/5 hover:border-white/10'
                          )}
                        >
                          <View className="space-y-3">
                            {/* Header Row */}
                            <View className="flex flex-row items-start justify-between gap-3">
                              <View className="flex-1 space-y-1 min-w-0">
                                <Text className="text-white font-bbh text-sm leading-snug line-clamp-2">
                                  {goal.goalText}
                                </Text>
                                <View className="flex flex-row items-center gap-3">
                                  <Text className="text-white/50 text-xs font-bbh">
                                    {goal.currentDay}/{goal.targetDays}
                                  </Text>
                                  {isActive && (
                                    <View className="bg-white/20 rounded-full px-2 py-0.5">
                                      <Text className="text-white text-[10px] font-bbh font-semibold uppercase tracking-wider">
                                        Active
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              </View>

                              {/* Quick Actions */}
                              <View className="flex flex-row items-center gap-1">
                                <button
                                  onClick={() => handleEditGoal(goal)}
                                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                  disabled={isUpdating || isDeleting}
                                >
                                  <Icons.Edit size="xs" color="#ffffff" />
                                </button>
                                <button
                                  onClick={() => handleDeleteGoal(goal.id)}
                                  className="p-1.5 hover:bg-danger-500/20 rounded-lg transition-colors"
                                  disabled={isUpdating || isDeleting}
                                >
                                  <Icons.Trash size="xs" color="#EF4444" />
                                </button>
                              </View>
                            </View>

                            {/* Mini Progress */}
                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${goalProgress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full bg-white/30 rounded-full"
                              />
                            </div>

                            {/* Check In Button */}
                            <motion.div whileTap={{ scale: 0.98 }}>
                              <Button
                                label="Check In"
                                variant="outline"
                                size="sm"
                                fullWidth
                                onClick={() => handleCheckIn(goal.id)}
                                disabled={isCheckingIn || isDeleting}
                                loading={isCheckingIn}
                                className="text-xs"
                              />
                            </motion.div>
                          </View>
                        </View>
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </View>
          </View>
        )}

        {/* Edit Goal Modal */}
        <AnimatePresence>
          {editingGoal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              onClick={() => {
                setEditingGoal(null)
                setEditFormData({ goalText: '', targetDays: '' })
              }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card-700 rounded-3xl p-6 border border-white/10 w-full max-w-md space-y-4"
              >
                <View className="flex flex-row items-center justify-between">
                  <Text className="text-white text-xl font-bbh font-bold">
                    Edit Goal
                  </Text>
                  <button
                    onClick={() => {
                      setEditingGoal(null)
                      setEditFormData({ goalText: '', targetDays: '' })
                    }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <Icons.X size="sm" color="#ffffff" />
                  </button>
                </View>

                <View className="space-y-4">
                  <View>
                    <TextArea
                      placeholder="What's your commitment?"
                      value={editFormData.goalText}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, goalText: e.target.value })
                      }}
                      className="min-h-[80px] bg-card-600/50 border-white/10"
                      maxLength={500}
                    />
                  </View>

                  <View>
                    <Input
                      type="number"
                      placeholder="Days (1-365)"
                      value={editFormData.targetDays}
                      onChange={(e) => {
                        setEditFormData({ ...editFormData, targetDays: e.target.value })
                      }}
                      className="bg-card-600/50 border-white/10"
                      min={1}
                      max={365}
                    />
                  </View>

                  <Button
                    label="Save"
                    variant="default"
                    fullWidth
                    onClick={handleUpdateGoal}
                    disabled={isUpdating}
                    loading={isUpdating}
                  />
                </View>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </View>
    </View>
  )
}
