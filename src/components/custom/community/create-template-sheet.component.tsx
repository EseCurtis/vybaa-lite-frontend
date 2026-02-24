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
    title: '',
    description: '',
    targetDays: '',
    icon: '',
  })
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      setFormError('Template title is required')
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
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          targetDays,
          icon: formData.icon.trim() || undefined,
        },
      })
      
      setFormData({ title: '', description: '', targetDays: '', icon: '' })
      onSuccess?.()
    } catch (err: any) {
      setFormError(err.message || 'Failed to create template')
    }
  }

  return (
    <View className="space-y-4">
      <View>
        <Input
          placeholder="Template title"
          value={formData.title}
          onChange={(e) => {
            setFormData({ ...formData, title: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light/40 border-white/10 text-white"
          maxLength={200}
        />
      </View>

      <View>
        <TextArea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) => {
            setFormData({ ...formData, description: e.target.value })
            setFormError(null)
          }}
          className="min-h-[100px] bg-card-light/40 p-4 text-white rounded-2xl"
          maxLength={1000}
        />
      </View>

      <View>
        <Input
          type="number"
          placeholder="Target days (1-365)"
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

      <View>
        <Input
          placeholder="Icon emoji (optional)"
          value={formData.icon}
          onChange={(e) => {
            setFormData({ ...formData, icon: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light/40 border-white/10 text-white"
          maxLength={50}
        />
        <Text className="text-white/60 text-xs font-bbh mt-1 ml-1">
          Enter an emoji or icon identifier
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
