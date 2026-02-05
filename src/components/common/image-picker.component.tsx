import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { uploadAPI } from '@/shared/api/upload.api'
import { useToast } from '@/providers/toast.provider'
import { cn } from '@/shared/utils/helpers.util'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface ImagePickerProps {
  currentImageUrl?: string
  onImageSelect: (imageUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
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
  const [isUploading, setIsUploading] = useState(false)

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl',
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Failed to get canvas context'))
            return
          }

          // Calculate new dimensions (max 800x800)
          const maxSize = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width
              width = maxSize
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height
              height = maxSize
            }
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to base64 with quality compression (0.7 = 70% quality)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          resolve(compressedDataUrl)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setIsUploading(true)
      
      // Compress image
      const compressedDataUrl = await compressImage(file)
      setPreview(compressedDataUrl)

      // Upload to Cloudinary via backend
      const uploadResponse = await uploadAPI.uploadImage({
        image: compressedDataUrl,
        folder: 'profile-images',
      })

      // Return Cloudinary URL to parent
      onImageSelect(uploadResponse.data.url)
      toast.success('Image uploaded successfully')
    } catch (error: any) {
      console.error('Image upload failed:', error)
      toast.error(error.message || 'Image upload failed')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const displayImage = preview || currentImageUrl

  return (
    <div className={cn('relative', className)}>
      <motion.div
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer"
        onClick={handleClick}
      >
        <div
          className={cn(
            'rounded-full bg-card-700 flex items-center justify-center overflow-hidden relative group',
            sizeClasses[size]
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

          {/* Overlay on hover or uploading */}
          <div className={cn(
            "absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            {isUploading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            ) : (
              <Icons.Edit size="sm" color="#ffffff" />
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          "absolute -bottom-1 -right-1 bg-accent-500 rounded-full p-2 shadow-lg border-2 border-black z-10",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
        type="button"
      >
        <Icons.Edit size="xs" color="#ffffff" />
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
