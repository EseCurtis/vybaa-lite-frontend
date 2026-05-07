import { Button } from '@/components/layout/button.component'
import { View } from '@/components/layout/view.component'

interface ProfileActionButtonsProps {
  isEditing: boolean
  isSaving: boolean
  onCancel: () => void
  onEdit: () => void
  onSave: () => void
}

export function ProfileActionButtons({
  isEditing,
  isSaving,
  onCancel,
  onEdit,
  onSave,
}: ProfileActionButtonsProps) {
  return (
    <View className="flex flex-row gap-3">
      {!isEditing ? (
        <Button
          label="Edit Profile"
          variant="default"
          fullWidth
          onClick={onEdit}
          textClassName="text-sm"
          style={{ width: '100%' }}
        />
      ) : (
        <>
          <Button
            label="Cancel"
            variant="outline"
            fullWidth
            onClick={onCancel}
            disabled={isSaving}
            textClassName="text-sm"
            style={{ width: '100%' }}
          />
          <Button
            label="Save"
            variant="default"
            fullWidth
            onClick={onSave}
            disabled={isSaving}
            loading={isSaving}
            textClassName="text-sm"
            style={{ width: '100%' }}
          />
        </>
      )}
    </View>
  )
}
