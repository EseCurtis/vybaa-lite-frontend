import { domtoimage } from '@/plugins/dom-to-img'
import { useToast } from '@/providers/toast.provider'
import { shareImageBlob } from '@/shared/utils/filesystem.util'
import html2canvas from 'html2canvas'
import { useCallback } from 'react'

interface UseDomExportOptions {
  scale?: number
  quality?: number
  format?: 'png' | 'jpeg'
  logging?: boolean
}

/**
 * Hook to export and share DOM elements as images
 * Encapsulates the logic for converting DOM to image and sharing
 */
export function useDomExport(options: UseDomExportOptions = {}) {
  const {
    scale = 7,
    quality = 1.0,
    format = 'png',
    logging = false,
  } = options

  const toast = useToast()

  const exportAndShare = useCallback(
    async (element: HTMLElement | null) => {
      if (!element) {
        toast.error('Card not found')
        return
      }

      try {
        toast.loading('Generating image...')

        // Convert to canvas using html2canvas (fallback/backup method)
        const canvas = await html2canvas(element, {
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          logging,
        })

        // Convert canvas to blob (fallback)
        const canvasBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob!)
            },
            `image/${format}`,
            quality,
          )
        })

        // Calculate scaled dimensions
        const style = {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: element.clientWidth + 'px',
          height: element.clientHeight + 'px',
        }

        // Use domtoimage for better quality
        const blob = await domtoimage.toBlob(element, {
          width: element.clientWidth * scale,
          height: element.clientHeight * scale,
          style,
        })

        // Share the image
        await shareImageBlob(blob)

        toast.dismiss()
      } catch (error: any) {
        console.error('Export failed:', error)
        toast.dismiss()
        toast.error('Failed to export image')
      }
    },
    [scale, quality, format, logging, toast],
  )

  return { exportAndShare }
}
