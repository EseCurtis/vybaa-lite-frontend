import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useToast } from '@/providers/toast.provider'
import { useState } from 'react'

interface CreateGoalSheetProps {
  onSuccess?: () => void
}

export function CreateGoalSheet({ onSuccess }: CreateGoalSheetProps) {
  const toast = useToast()
  const { mutateAsync: createGoal, isPending: isCreating } = useCreateGoal()
  
  const [formData, setFormData] = useState({
    goalText: '',
    targetDays: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    // Validate goal text
    if (!formData.goalText.trim()) {
      const errorMsg = 'Goal text is required'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    // Validate target days
    const targetDays = parseInt(formData.targetDays, 10)
    if (!targetDays || targetDays < 1 || targetDays > 365) {
      const errorMsg = 'Target days must be between 1 and 365'
      setFormError(errorMsg)
      toast.warning(errorMsg)
      return
    }

    try {
      setFormError(null)
      await createGoal({
        goalText: formData.goalText.trim(),
        targetDays,
      })
      
      // Reset form and dismiss on success
      setFormData({ goalText: '', targetDays: '' })
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create goal'
      setFormError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <View className="space-y-4">
      <View>
        <TextArea
          placeholder="What's your commitment?"
          value={formData.goalText}
          onChange={(e) => {
            setFormData({ ...formData, goalText: e.target.value })
            setFormError(null)
          }}
          className="min-h-[100px] bg-card-light/40 p-1 text-white"
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
          className="bg-card-light/40 border-white/10 text-white"
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
        label="Create Goal"
        variant="default"
        fullWidth
        onClick={handleSubmit}
        disabled={isCreating}
        loading={isCreating}
        textClassName='text-sm'
      />
    </View>
  )
}
