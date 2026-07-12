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
        <></>
      ) : (
        <>
          <View className="w-full">
            <Button
              label="Save changes"
              variant="default"
              fullWidth
              onClick={onSave}
              disabled={isSaving}
              loading={isSaving}
              textClassName="text-sm"
              style={{ width: '100%' }}
            />
          </View>
          <View className="">
            <Button
              label="Cancel"
              variant="secondary"
              fullWidth
              onClick={onCancel}
              disabled={isSaving}
              textClassName="text-sm"
              style={{ width: '100%' }}
            />
          </View>
        </>
      )}
    </View>
  )
}
