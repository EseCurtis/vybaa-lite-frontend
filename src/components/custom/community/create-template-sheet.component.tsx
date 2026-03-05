import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateTemplate } from '@/hooks/use-communities.hook'
import { useState } from 'react'

interface CreateTemplateSheetProps {
  communityId: string
  onSuccess?: () => void
}

export function CreateTemplateSheet({ communityId, onSuccess }: CreateTemplateSheetProps) {
  const { mutateAsync: createTemplate, isPending: isCreating } = useCreateTemplate()
  
  const [formData, setFormData] = useState({
    goalText: '',
    targetDays: '',
    reminderTime: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
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
      await createTemplate({
        communityId,
        data: {
          goalText: formData.goalText.trim(),
          targetDays,
          reminderTime: formData.reminderTime || undefined,
        },
      })
      
      setFormData({ goalText: '', targetDays: '', reminderTime: '' })
      onSuccess?.()
    } catch (err: any) {
      setFormError(err.message || 'Failed to create template')
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
          className="min-h-[100px] rounded-xl bg-card-light/30 p-1 text-white"
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
          className="bg-card-light/30 border-0 text-white"
          min={1}
          max={365}
        />
      </View>

      <View>
        <Input
          type="time"
          placeholder="Reminder Time (Optional)"
          value={formData.reminderTime}
          onChange={(e) => {
            setFormData({ ...formData, reminderTime: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light/30 border-0 text-white"
        />
        <Text className="text-card-lighter-3/60 text-xs text-center font-bbh mt-1 ml-1">
          Set a daily reminder time (optional) - tap to select
        </Text>
      </View>

      {formError && (
        <Text className="text-danger-500 text-sm font-bbh">
          {formError}
        </Text>
      )}

      <Button
        label="Create Template"
        variant="default"
        fullWidth
        onClick={handleSubmit}
        disabled={isCreating}
        loading={isCreating}
        textClassName="text-sm"
      />
    </View>
  )
}
