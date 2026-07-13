import { Input } from '@/components/common/input.component'
import { Switch } from '@/components/common/switch.component'
import { TextArea } from '@/components/common/textarea.component'
import { TimeField } from '@/components/common/time-field.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useToast } from '@/providers/toast.provider'
import { randomCreateGoalPlaceholder } from '@/shared/goal/goal.util.shared'
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
    reminderTime: '',
  })
  const [reminderEnabled, setReminderEnabled] = useState(false)
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
        reminderTime:
          reminderEnabled && formData.reminderTime
            ? formData.reminderTime
            : undefined,
      })
      
      // Reset form and dismiss on success
      setFormData({ goalText: '', targetDays: '', reminderTime: '' })
      setReminderEnabled(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create goal'
      setFormError(errorMsg)
      toast.error(errorMsg)
    }
  }

  return (
    <View className="space-y-4">
      <View className='mt-3'>
        <TextArea
          placeholder={randomCreateGoalPlaceholder()}
          value={formData.goalText}
          onChange={(e) => {
            setFormData({ ...formData, goalText: e.target.value })
            setFormError(null)
          }}
          className="min-h-[10px] border-b !rounded-none border-card-light rounded-xl bsg-card-light/30 !px-0 text-white"
          maxLength={500}
          autoFocus
          rows={2}
        />
      </View>

      <View className='flex-row items-center gap-3'>
        <Text className="text-card-lighter-3 whitespace-nowrap">For how long?</Text>
        <Input
          type="number"
          placeholder="20 days"
          value={formData.targetDays}
          onChange={(e) => {
            setFormData({ ...formData, targetDays: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light/30 border-0 text-white"
          min={1}
          max={365}
        />
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-card-lighter-3/80 text-xs font-bbh">
            Remind me at? (optional)
          </Text>
          <Switch
            checked={reminderEnabled}
            onChange={(checked) => {
              setReminderEnabled(checked)
              if (!checked) {
                setFormData({ ...formData, reminderTime: '' })
              }
            }}
          />
        </View>
        <TimeField
          value={formData.reminderTime}
          onChange={(val) => {
            setFormData({ ...formData, reminderTime: val })
            setFormError(null)
          }}
          disabled={!reminderEnabled}
        />
        <Text className="text-card-lighter-3/60 text-center hidden text-xs text-left font-bbh mt-1 ml-1">
          Set a daily reminder time (optional) - toggle on to schedule
        </Text>
      </View>

      {formError && (
        <Text className="text-danger-500 text-sm font-bbh">
          {formError}
        </Text>
      )}
      <View className="p-10"></View>

      <View className="absolute bottom-0 left-0 w-full p-mg">
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
    </View>
  )
}
