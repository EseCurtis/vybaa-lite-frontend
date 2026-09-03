import { useToast } from '@/providers/toast.provider'
import { shareImageBlob } from '@/shared/utils/filesystem.util'
import html2canvas from 'html2canvas'
import { useCallback } from 'react'

/**
 * Custom hook to export Flexx cards as images using html2canvas
 * Captures the actual styled DOM element
 */
export function useFlexxExport() {
  const toast = useToast()

  const exportCardFromElement = useCallback(
    async (element: HTMLElement | null) => {
      if (!element) {
        toast.error('Card not found')
        return false
      }

      try {
        toast.loading('Generating your Flexx card...')

        // Get the actual rendered dimensions
        const rect = element.getBoundingClientRect()
        const targetWidth = 1080 // Instagram story size
        const targetHeight = 1920
        const scale = targetWidth / rect.width

        // Use html2canvas to capture the actual styled DOM
        const canvas = await html2canvas(element, {
          scale: scale, // Calculate scale to match target dimensions
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#000000', // Black background
          width: rect.width,
          height: rect.height,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        })

        // Create a new canvas with exact dimensions and black background
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = targetWidth
        finalCanvas.height = targetHeight
        const ctx = finalCanvas.getContext('2d')

        if (!ctx) throw new Error('Could not get canvas context')

        // Fill with black background first
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, targetWidth, targetHeight)

        // Draw the captured canvas centered on the final canvas
        const scaledHeight = rect.height * scale
        const yOffset = (targetHeight - scaledHeight) / 2

        ctx.drawImage(
          canvas,
          0,
          0,
          canvas.width,
          canvas.height,
          0,
          yOffset,
          targetWidth,
          scaledHeight,
        )

        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          finalCanvas.toBlob(
            (blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Failed to create blob'))
            },
            'image/png',
            1.0,
          )
        })

        // Share
        await shareImageBlob(blob)

        toast.dismiss()
        toast.success('Flexx card shared!')
        return true
      } catch (error) {
        console.error('Export failed:', error)
        toast.dismiss()
        toast.error('Failed to export card')
        return false
      }
    },
    [toast],
  )

  return { exportCardFromElement }
}
