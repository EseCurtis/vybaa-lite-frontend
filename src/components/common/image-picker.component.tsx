import { Icons } from '@/components/layout/icon.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
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
  const [preview, setPreview] = useState<string | null>(null)

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl',
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return
    }

    // Read file as data URL
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setPreview(dataUrl)
      onImageSelect(dataUrl)
    }
    reader.readAsDataURL(file)
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

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Icons.Edit size="sm" color="#ffffff" />
          </div>
        </div>
      </motion.div>

      {/* Edit button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        className="absolute -bottom-1 -right-1 bg-accent-500 rounded-full p-2 shadow-lg border-2 border-black z-10"
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
