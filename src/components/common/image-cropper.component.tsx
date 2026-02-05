import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useState, useCallback } from 'react'
import Cropper, { Area } from 'react-easy-crop'
import { motion } from 'framer-motion'

interface ImageCropperProps {
  image: string
  onCropComplete: (croppedImage: string) => void
  onCancel: () => void
  aspectRatio?: number
}

export function ImageCropper({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createCroppedImage = async (): Promise<string> => {
    if (!croppedAreaPixels) throw new Error('No crop area')

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const img = new Image()
      
      img.onload = () => {
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        // Set canvas size to cropped area
        canvas.width = croppedAreaPixels.width
        canvas.height = croppedAreaPixels.height

        // Draw cropped image
        ctx.drawImage(
          img,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        )

        // Convert to base64
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        resolve(croppedDataUrl)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = image
    })
  }

  const handleDone = async () => {
    if (!croppedAreaPixels) return

    try {
      setIsProcessing(true)
      const croppedImage = await createCroppedImage()
      onCropComplete(croppedImage)
    } catch (error) {
      console.error('Crop failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[30000] bg-black"
    >
      {/* Cropper Area */}
      <View className="absolute inset-0">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
          style={{
            containerStyle: {
              background: '#000000',
            },
          }}
        />
      </View>

      {/* Controls */}
      <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6 space-y-4">
        {/* Zoom Slider */}
        <View className="space-y-2">
          <Text className="text-white/70 text-sm font-bbh text-center">
            Zoom
          </Text>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-accent-500"
          />
        </View>

        {/* Buttons */}
        <View className="flex-row gap-3">
          <Button
            label="Cancel"
            variant="outline"
            fullWidth
            onClick={onCancel}
            disabled={isProcessing}
            textClassName="text-sm"
          />
          <Button
            label="Done"
            variant="default"
            fullWidth
            onClick={handleDone}
            disabled={isProcessing}
            loading={isProcessing}
            textClassName="text-sm"
          />
        </View>
      </View>
    </motion.div>
  )
}
