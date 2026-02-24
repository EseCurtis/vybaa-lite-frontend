import { Input } from '@/components/common/input.component'
import { TextArea } from '@/components/common/textarea.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { ImagePicker } from '@/components/common/image-picker.component'
import { useCreateCommunity } from '@/hooks/use-communities.hook'
import { uploadAPI } from '@/shared/api/upload.api'
import { useToast } from '@/providers/toast.provider'
import { cn } from '@/shared/utils/helpers.util'
import { useState } from 'react'

interface CreateCommunitySheetProps {
  onSuccess?: () => void
}

export function CreateCommunitySheet({ onSuccess }: CreateCommunitySheetProps) {
  const toast = useToast()
  const { mutateAsync: createCommunity, isPending: isCreating } = useCreateCommunity()
  
  const predefinedCovers = [
    {
      id: 'focus',
      label: 'Deep focus',
      url: 'https://images.pexels.com/photos/4144595/pexels-photo-4144595.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      id: 'morning',
      label: 'Calm mornings',
      url: 'https://images.pexels.com/photos/3274822/pexels-photo-3274822.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      id: 'city',
      label: 'Night city',
      url: 'https://images.pexels.com/photos/316093/pexels-photo-316093.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
    {
      id: 'nature',
      label: 'Nature walks',
      url: 'https://images.pexels.com/photos/3404200/pexels-photo-3404200.jpeg?auto=compress&cs=tinysrgb&w=800',
    },
  ]

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    isPublic: true,
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(predefinedCovers[0]?.id ?? null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(predefinedCovers[0]?.url ?? null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setFormError('Community name is required')
      return
    }

    try {
      setFormError(null)
      const payloadCoverImage = coverImageUrl || undefined

      await createCommunity({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        coverImage: payloadCoverImage,
        category: formData.category.trim() || undefined,
        isPublic: formData.isPublic,
      })
      
      setFormData({ name: '', description: '', category: '', isPublic: true })
      setSelectedCoverId(predefinedCovers[0]?.id ?? null)
      setCoverImageUrl(predefinedCovers[0]?.url ?? null)
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

      {/* Cover image selection */}
      <View className="space-y-2">
        <Text className="text-white/80 text-sm font-bbh">
          Cover image
        </Text>
        <View className="flex-row gap-3 overflow-x-auto no-scrollbar py-1">
          {predefinedCovers.map((cover) => {
            const isActive = selectedCoverId === cover.id
            return (
              <button
                key={cover.id}
                type="button"
                onClick={() => {
                  setSelectedCoverId(cover.id)
                  setCoverImageUrl(cover.url)
                }}
                className={cn(
                  'relative w-28 h-20 rounded-2xl overflow-hidden border transition-all shrink-0',
                  isActive ? 'border-accent-500' : 'border-card-lighter',
                )}
              >
                <img
                  src={cover.url}
                  alt={cover.label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30" />
                <div className="absolute bottom-1 left-1 right-1">
                  <Text className="text-white/80 text-[10px] font-bbh truncate">
                    {cover.label}
                  </Text>
                </div>
              </button>
            )
          })}

          {/* Upload your own */}
          <View className="shrink-0">
            <ImagePicker
              size="md"
              currentImageUrl={coverImageUrl || undefined}
              initials="C"
              onImageSelect={async (imageDataUrl) => {
                try {
                  setIsUploadingImage(true)
                  const loadingToast = toast.loading('Uploading cover...')
                  const res = await uploadAPI.uploadImage({
                    image: imageDataUrl,
                    folder: 'community-covers',
                  })
                  setCoverImageUrl(res.data.url)
                  setSelectedCoverId('custom')
                  //@ts-ignore
                  toast.dismiss(loadingToast)
                  toast.success('Cover image uploaded!')
                } catch (error: any) {
                  //@ts-ignore
                  toast.dismiss()
                  toast.error(error?.message || 'Failed to upload cover image')
                } finally {
                  setIsUploadingImage(false)
                }
              }}
              className="border border-card-lighter rounded-2xl bg-card-light"
            />
            <Text className="text-white/40 text-[10px] font-bbh mt-1 text-center">
              Upload
            </Text>
          </View>
        </View>
        <Text className="text-white/40 text-[11px] font-bbh">
          Choose a calm background that fits the vibe of your community.
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
