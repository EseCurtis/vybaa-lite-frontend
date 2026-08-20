import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { useToast } from '@/providers/toast.provider'
import { IS_IOS } from '@/shared/constants.shared'
import { cn } from '@/shared/utils/helpers.util'
import {
  getImagePickerFailureMessage,
  isImagePickerCancellation,
} from '@/shared/utils/image-picker-error.util'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { AnimatePresence, motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { ImageCropper } from './image-cropper.component'

interface ImagePickerProps {
  currentImageUrl?: string
  onImageSelect: (imageDataUrl: string) => void // Returns base64, parent handles upload
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  initials?: string
}

export function ImagePicker({
  currentImageUrl,
  onImageSelect,
  size = 'lg',
  className,
  initials = 'U',
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [preview, setPreview] = useState<string | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl',
    xl: 'w-32 h-32 text-4xl',
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      // Read file as data URL for cropper
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setImageToCrop(dataUrl)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('Image read failed:', error)
      toast.error('Failed to read image')
    }
  }

  const handleCropComplete = async (croppedImage: string) => {
    try {
      // Compress the cropped image
      const compressedDataUrl = await compressImageDataUrl(croppedImage)
      setPreview(compressedDataUrl)
      setImageToCrop(null)

      // Return compressed base64 to parent (parent will handle Cloudinary upload on save)
      onImageSelect(compressedDataUrl)
    } catch (error) {
      console.error('Image compression failed:', error)
      toast.error('Failed to process image')
    }
  }

  const handleCropCancel = () => {
    setImageToCrop(null)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Helper to compress a data URL
  const compressImageDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Set canvas to image size (already cropped to desired size)
        canvas.width = img.width
        canvas.height = img.height

        // Draw and compress
        ctx.drawImage(img, 0, 0)
        const compressed = canvas.toDataURL('image/jpeg', 0.8)
        resolve(compressed)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = dataUrl
    })
  }

  async function handleClick(): Promise<void> {
    if (IS_IOS) {
      try {
        const photo = await Camera.getPhoto({
          allowEditing: false,
          correctOrientation: true,
          presentationStyle: 'popover',
          promptLabelCancel: 'Cancel',
          promptLabelHeader: 'Choose a photo',
          promptLabelPhoto: 'Choose from Photos',
          promptLabelPicture: 'Take a Photo',
          quality: 90,
          resultType: CameraResultType.DataUrl,
          saveToGallery: false,
          source: CameraSource.Prompt,
        })

        if (!photo.dataUrl?.startsWith('data:image/')) {
          throw new Error('Image picker returned invalid data')
        }

        setImageToCrop(photo.dataUrl)
      } catch (error: unknown) {
        if (!isImagePickerCancellation(error)) {
          toast.error(getImagePickerFailureMessage(error))
        }
      }
      return
    }

    fileInputRef.current?.click()
  }

  const displayImage = preview || currentImageUrl

  return (
    <>
      <div className={cn('relative', className)}>
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="cursor-pointer"
          onClick={() => void handleClick()}
        >
          <div
            className={cn(
              'rounded-full bg-card-700 flex items-center justify-center overflow-hidden relative group',
              sizeClasses[size],
            )}
          >
            {displayImage ? (
              <img
                src={displayImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <Text className="text-white font-bbh">{initials}</Text>
            )}

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icons.Edit size="sm" color="#ffffff" />
            </div>
          </div>
        </motion.div>

        {/* Edit button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => void handleClick()}
          className="absolute flex flex-row items-center gap-3 text-white -bottom-1 -right-1/4 bg-accent-500 pr-3 rounded-full p-3 py-2 shadow-lg border-2 border-black z-10"
          type="button"
        >
          <Icons.Edit size="xs" color="#ffffff" />
          <Text className="text-xs font-bold">Upload</Text>
        </motion.button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Cropper Modal */}
      <AnimatePresence>
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop}
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
            aspectRatio={1}
          />
        )}
      </AnimatePresence>
    </>
  )
}
