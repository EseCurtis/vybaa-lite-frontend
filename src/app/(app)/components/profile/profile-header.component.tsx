import { ImagePicker } from '@/components/common/image-picker.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { UserCheckmark } from '@/components/user/checkmark.component'
import { cn } from '@/shared/utils/helpers.util'
import { motion } from 'framer-motion'
import type { ProfileUser } from './profile.types'

interface ProfileHeaderProps {
  displayName: string
  imagePreview: string | null
  initials: string
  isEditing: boolean
  onImageSelect: (imageDataUrl: string) => void
  user: ProfileUser
  onEdit: () => void
}

export function ProfileHeader({
  displayName,
  imagePreview,
  initials,
  isEditing,
  onImageSelect,
  user,
  onEdit,
}: ProfileHeaderProps) {
  return (
    <motion.div>
      <View className="items-center gap-4 flex-row space-y-4">
        <View className={cn(isEditing && 'mx-auto pb-4', 'relative')}>
          {isEditing ? (
            <ImagePicker
              currentImageUrl={imagePreview ?? undefined}
              onImageSelect={onImageSelect}
              initials={initials}
              size="xl"
            />
          ) : (
            <View className="rounded-full w-24 h-24 bg-card-light/60 flex items-center justify-center overflow-hidden relative z-k">
              {imagePreview || user?.avatarUrl ? (
                <img
                  src={imagePreview || user?.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text className="text-white text-4xl font-display font-bold">
                  {initials}
                </Text>
              )}
            </View>
          )}
        </View>

        {!isEditing && (
          <View className="items-start space-y-1">
            <Text className="text-white text-xl font-display font-bold">
              {displayName}
            </Text>
            <View className="flex-row items-center gap-1">
              <Text className="text-white/50 text-sm font-bbh">
                @{user?.username}
              </Text>
              <UserCheckmark />
            </View>
          </View>
        )}

        {!isEditing && (
          <View className="ml-auto">
            <Button
              label="Edit "
              variant="default"
              fullWidth
              onClick={onEdit}
              textClassName="text-sm"
              style={{ width: '100%' }}
              size="sm"
            />
          </View>
        )}
      </View>
    </motion.div>
  )
}
