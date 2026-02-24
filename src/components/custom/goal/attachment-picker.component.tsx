import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import { uploadAPI } from '@/shared/api/upload.api'
import { smartTruncate } from '@/shared/utils/helpers.util'
import { RiCloseLine, RiImageLine, RiMicLine } from '@remixicon/react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'

export interface Attachment {
  type: 'image' | 'audio'
  url: string
  publicId?: string
  name?: string
}

interface AttachmentPickerProps {
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
  maxAttachments?: number
}

export function AttachmentPicker({
  attachments,
  onAttachmentsChange,
  maxAttachments = 5,
}: AttachmentPickerProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [uploading, setUploading] = useState(false)

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB')
      return
    }

    if (attachments.length >= maxAttachments) {
      toast.error(`Maximum ${maxAttachments} attachments allowed`)
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        try {
          const response = await uploadAPI.uploadImage({
            image: base64,
            folder: 'check-ins',
          })
          onAttachmentsChange([
            ...attachments,
            {
              type: 'image',
              url: response.data.url,
              publicId: response.data.publicId,
              name: file.name,
            },
          ])
          toast.success('Image uploaded successfully')
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload image')
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image file')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error(error.message || 'Failed to process image')
      setUploading(false)
    }

    // Reset input
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleAudioSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      toast.error('Please select a valid audio file')
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error('Audio size must be less than 20MB')
      return
    }

    if (attachments.length >= maxAttachments) {
      toast.error(`Maximum ${maxAttachments} attachments allowed`)
      return
    }

    try {
      setUploading(true)
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = e.target?.result as string
        try {
          // For audio, we'll use the image upload endpoint (Cloudinary supports audio too)
          // Or we might need a separate audio upload endpoint
          const response = await uploadAPI.uploadImage({
            image: base64,
            folder: 'check-ins/audio',
          })
          onAttachmentsChange([
            ...attachments,
            {
              type: 'audio',
              url: response.data.url,
              publicId: response.data.publicId,
              name: file.name,
            },
          ])
          toast.success('Audio uploaded successfully')
        } catch (error: any) {
          toast.error(error.message || 'Failed to upload audio')
        } finally {
          setUploading(false)
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read audio file')
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      toast.error(error.message || 'Failed to process audio')
      setUploading(false)
    }

    // Reset input
    if (audioInputRef.current) {
      audioInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    const attachment = attachments[index]
    const newAttachments = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(newAttachments)

    // Optionally delete from Cloudinary
    if (attachment.publicId) {
      uploadAPI.deleteImage(attachment.publicId).catch((err) => {
        console.error('Failed to delete attachment:', err)
      })
    }
  }

  return (
    <View className="space-y-2">
      <View className="flex-row gap-2">
        <Pressable
          onPress={() => imageInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxAttachments}
          className="bg-cardd-700/30 hover:bg-cardd-700/40 rounded-lg px-3 py-2 flex-row items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <RiImageLine size={16} className="text-white/60" />
        </Pressable>

        <Pressable
          onPress={() => audioInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxAttachments}
          className="bg-cardd-700/30 hover:bg-cardd-700/40 rounded-lg px-3 py-2 flex-row items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
        >
          <RiMicLine size={16} className="text-white/60" />
        </Pressable>
      </View>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={handleAudioSelect}
        className="hidden"
      />

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <View className="space-y-2">
            {attachments.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-cardd-700/30 rounded-lg p-2.5 flex-row items-center gap-2.5 border border-white/5"
              >
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name || 'Attachment'}
                    className="w-12 h-12 rounded-md object-cover"
                  />
                ) : (
                  <View className="w-12 h-12 rounded-md bg-primary-500/20 flex items-center justify-center">
                    <RiMicLine size={18} className="text-primary-400" />
                  </View>
                )}
                <View className="flex-1 min-w-0">
                  {attachment.type === 'audio' ? (
                    <audio
                      controls
                      src={attachment.url}
                      className="w-full h-7"
                      style={{ maxWidth: '180px' }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <>
                      <Text className="text-white/90 text-xs font-bbh font-medium truncate">
                        {smartTruncate(attachment.name || 'Image Attachment', 10)}
                      </Text>
                      <Text className="text-white/40 text-[10px] font-bbh">
                        Image
                      </Text>
                    </>
                  )}
                </View>
                <Pressable
                  onPress={() => removeAttachment(index)}
                  className="p-1 rounded-md hover:bg-white/5 transition-colors"
                >
                  <RiCloseLine size={14} className="text-white/50" />
                </Pressable>
              </motion.div>
            ))}
          </View>
        )}
      </AnimatePresence>

      {uploading && (
        <Text className="text-white/60 text-xs font-bbh text-center">
          Uploading...
        </Text>
      )}
    </View>
  )
}
