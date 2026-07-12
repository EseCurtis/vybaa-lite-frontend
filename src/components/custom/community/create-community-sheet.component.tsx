import { Input } from '@/components/common/input.component'
import { ImagePicker } from '@/components/common/image-picker.component'
import { TextArea } from '@/components/common/textarea.component'
import { CommunityIllustration } from '@/components/custom/community/community-illustration.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useCreateCommunity } from '@/hooks/use-communities.hook'
import { useToast } from '@/providers/toast.provider'
import { uploadAPI } from '@/shared/api/upload.api'
import {
  communityIllustrations,
  getCommunityIllustrationToken,
  isCommunityIllustrationToken,
} from '@/shared/community/community-illustrations'
import { cn } from '@/shared/utils/helpers.util'
import { RiCheckLine, RiImageAddLine } from '@remixicon/react'
import { useState } from 'react'

interface CreateCommunitySheetProps {
  onSuccess?: () => void
}

export function CreateCommunitySheet({ onSuccess }: CreateCommunitySheetProps) {
  const toast = useToast()
  const { mutateAsync: createCommunity, isPending: isCreating } = useCreateCommunity()
  const defaultCover = getCommunityIllustrationToken(communityIllustrations[0]!.id)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isPublic: true,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [coverImage, setCoverImage] = useState<string>(defaultCover)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Community name is required')
      return
    }

    try {
      setFormError(null)

      await createCommunity({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        coverImage,
        category: formData.category.trim() || undefined,
        isPublic: formData.isPublic,
      })
      
      setFormData({ name: '', description: '', category: '', isPublic: true })
      setCoverImage(defaultCover)
      onSuccess?.()
    } catch (err: any) {
      setFormError(err.message || 'Failed to create community')
    }
  }

  return (
    <View className="space-y-4">
      <View>
        <Input
          placeholder="Community name"
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light text-white"
          maxLength={100}
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
          className="min-h-[100px] bg-card-light p-4 text-white rounded-2xl"
          maxLength={1000}
        />
      </View>

      {/* Cover illustration selection */}
      <View className="space-y-2">
        <Text className="text-white/80 text-sm font-bbh">
          Cover illustration
        </Text>
        <View className="flex-row gap-3 overflow-x-auto no-scrollbar py-1">
          {communityIllustrations.map((cover) => {
            const token = getCommunityIllustrationToken(cover.id)
            const isActive = coverImage === token
            return (
              <button
                key={cover.id}
                type="button"
                onClick={() => {
                  setCoverImage(token)
                }}
                className={cn(
                  'relative w-28 h-20 rounded-2xl overflow-hidden border transition-all shrink-0',
                  isActive ? 'border-accent-500' : 'border-card-lighter',
                )}
              >
                <CommunityIllustration
                  className="h-full w-full"
                  label={cover.label}
                  seed={cover.id}
                  value={token}
                />
                {isActive ? (
                  <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white">
                    <RiCheckLine size={16} className="text-black" />
                  </div>
                ) : null}
                <div className="absolute bottom-1 left-1 right-1">
                  <Text className="text-white/80 text-[10px] font-bbh truncate">
                    {cover.label}
                  </Text>
                </div>
              </button>
            )
          })}
          <View className="shrink-0">
            <ImagePicker
              className={cn(
                'border rounded-2xl bg-card-light',
                coverImage && !isCommunityIllustrationToken(coverImage)
                  ? 'border-accent-500'
                  : 'border-card-lighter',
              )}
              currentImageUrl={
                coverImage && !isCommunityIllustrationToken(coverImage)
                  ? coverImage
                  : undefined
              }
              initials="C"
              onImageSelect={async (imageDataUrl) => {
                const loadingToast = toast.loading('Uploading cover...')

                try {
                  setIsUploadingImage(true)
                  const res = await uploadAPI.uploadImage({
                    folder: 'community-covers',
                    image: imageDataUrl,
                  })
                  setCoverImage(res.data.url)
                  toast.dismiss(loadingToast)
                  toast.success('Cover image uploaded')
                } catch (error) {
                  toast.dismiss(loadingToast)
                  const message =
                    error instanceof Error
                      ? error.message
                      : 'Failed to upload cover image'
                  toast.error(message)
                } finally {
                  setIsUploadingImage(false)
                }
              }}
              size="md"
            />
            <View className="mt-1 flex-row items-center justify-center gap-1">
              <RiImageAddLine size={12} className="text-white/40" />
              <Text className="text-white/40 text-[10px] font-bbh">
                Upload
              </Text>
            </View>
          </View>
        </View>
        <Text className="text-white/40 text-[11px] font-bbh">
          Choose a patterned mark or upload a custom cover image.
        </Text>
      </View>

      <View>
        <Input
          placeholder="Category (optional)"
          value={formData.category}
          onChange={(e) => {
            setFormData({ ...formData, category: e.target.value })
            setFormError(null)
          }}
          className="bg-card-light text-white"
          maxLength={50}
        />
      </View>

      <View className="flex-row items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isPublic}
          onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        <Text className="text-white/60 text-sm font-bbh">
          Make this community public
        </Text>
      </View>

      {formError && (
        <Text className="text-danger-500 text-sm font-bbh">
          {formError}
        </Text>
      )}

      <Button
        label="Create Community"
        variant="default"
        fullWidth
        onClick={handleSubmit}
        disabled={isCreating || isUploadingImage}
        loading={isCreating || isUploadingImage}
        textClassName="text-sm"
      />
    </View>
  )
}
