import { useState } from 'react'
import { TopNotchPadd } from '@/components/common/notch.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { Button } from '@/components/layout/button.component'
import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { useGoalOperations } from '@/hooks/use-goals.hook'
import { cn } from '@/shared/utils/helpers.util'

export default function HomeAppScreen() {
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
  } = useGoalOperations()

  const [isCreatingForm, setIsCreatingForm] = useState(false)
  const [formData, setFormData] = useState({
    goalText: '',
    targetDays: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleCreateGoal = async () => {
    if (!formData.goalText.trim()) {
      setFormError('Goal text is required')
      return
    }

    const targetDays = parseInt(formData.targetDays, 10)
    if (!targetDays || targetDays < 1 || targetDays > 365) {
      setFormError('Target days must be between 1 and 365')
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
      setFormError(err.message || 'Failed to create goal')
    }
  }

  const handleCheckIn = async () => {
    try {
      await checkInAsync()
    } catch (err: any) {
      console.error('Check-in failed:', err)
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
          <Text className="text-white/70 text-xs font-outfit uppercase tracking-[0.2em]">
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
                  <Text className="text-white/70 text-sm font-outfit uppercase tracking-wide">
                    Day {currentGoal.currentDay} of {currentGoal.targetDays}
                  </Text>
                  <View className="bg-white/10 rounded-full px-3 py-1">
                    <Text className="text-white text-2xl font-bold font-bbh">
                      {currentGoal.currentDay}
                    </Text>
                  </View>
                </View>

                <Text className="text-white text-lg font-outfit leading-relaxed">
                  {currentGoal.goalText}
                </Text>

                <View className="pt-4 border-t border-card-500/30">
                  <Button
                    label="I showed up today"
                    variant="default"
                    fullWidth
                    onClick={handleCheckIn}
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
              <Text className="text-white/70 text-center font-outfit">
                Loading...
              </Text>
            ) : (
              <Text className="text-white/70 text-center font-outfit">
                No active goal. Create one to get started.
              </Text>
            )}
          </View>
        )}

        {/* Create Goal Section */}
        {!currentGoal && !loading && (
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
                <Text className="text-white text-xl font-outfit font-semibold">
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
                    <Text className="text-danger-500 text-sm font-outfit">
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
            <Text className="text-white/70 text-sm font-outfit uppercase tracking-wide">
              All Goals ({goals.length})
            </Text>

            <View className="space-y-3">
              {goals.map((goal) => (
                <View
                  key={goal.id}
                  className={cn(
                    'bg-card-700 rounded-xl p-4 border border-card-300/20',
                    goal.id === currentGoal?.id && 'border-white/40'
                  )}
                >
                  <View className="flex flex-row items-start justify-between">
                    <View className="flex-1 space-y-2">
                      <Text className="text-white font-outfit text-sm leading-relaxed">
                        {goal.goalText}
                      </Text>
                      <View className="flex flex-row items-center gap-4">
                        <Text className="text-white/60 text-xs font-outfit">
                          Day {goal.currentDay}/{goal.targetDays}
                        </Text>
                        {goal.lastCheckInDate && (
                          <Text className="text-white/40 text-xs font-outfit">
                            Last: {new Date(goal.lastCheckInDate).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                    {goal.id === currentGoal?.id && (
                      <View className="bg-white/20 rounded-full px-2 py-1">
                        <Text className="text-white text-xs font-outfit font-semibold">
                          Active
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View className="bg-danger-500/20 border border-danger-500 rounded-xl p-4">
            <Text className="text-danger-500 text-sm font-outfit">
              {error instanceof Error ? error.message : 'An error occurred'}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}
