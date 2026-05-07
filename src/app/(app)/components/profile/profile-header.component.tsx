import { ImagePicker } from '@/components/common/image-picker.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { motion } from 'framer-motion'
import type { ProfileUser } from './profile.types'

interface ProfileHeaderProps {
  displayName: string
  imagePreview: string | null
  initials: string
  isEditing: boolean
  onImageSelect: (imageDataUrl: string) => void
  user: ProfileUser
}

export function ProfileHeader({
  displayName,
  imagePreview,
  initials,
  isEditing,
  onImageSelect,
  user,
}: ProfileHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <View className="items-center space-y-4">
        <View className="relative">
          {isEditing ? (
            <ImagePicker
              currentImageUrl={imagePreview ?? undefined}
              onImageSelect={onImageSelect}
              size="lg"
              initials={initials}
            />
          ) : (
            <View className="rounded-full w-32 h-32 bg-card-light/60 flex items-center justify-center overflow-hidden relative z-k">
              {imagePreview || user?.avatarUrl ? (
                <img
                  src={imagePreview || user?.avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Text className="text-white text-4xl font-bbh font-bold">
                  {initials}
                </Text>
              )}
            </View>
          )}
        </View>

        <View className="items-center space-y-1">
          <Text className="text-white text-2xl font-bbh font-bold">
            {displayName}
          </Text>
          <Text className="text-white/50 text-sm font-bbh">
            @{user?.username}
          </Text>
        </View>
      </View>
    </motion.div>
  )
}
