import { useEffect, useRef, useState, type PointerEvent } from 'react'

import { hapticFeedback } from '@/shared/haptic.util'

export function useMessageGesture(onReply: () => void, onHold: () => void) {
  const [offset, setOffset] = useState(0)
  const start = useRef<{ x: number; y: number; swiping: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const consumed = useRef(false)
  const distance = useRef(0)

  function clearHold(): void {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
  }

  useEffect(() => () => clearHold(), [])

  function reset(): void {
    clearHold()
    start.current = null
    distance.current = 0
    setOffset(0)
  }

  return {
    offset,
    handlers: {
      onPointerDown(event: PointerEvent<HTMLButtonElement>): void {
        if (!event.isPrimary || event.button !== 0) return
        consumed.current = false
        start.current = { x: event.clientX, y: event.clientY, swiping: false }
        timer.current = setTimeout(() => {
          consumed.current = true
          start.current = null
          void hapticFeedback.selection()
          onHold()
        }, 450)
      },
      onPointerMove(event: PointerEvent<HTMLButtonElement>): void {
        const origin = start.current
        if (!origin) return
        const dx = event.clientX - origin.x
        const dy = event.clientY - origin.y
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearHold()
        if (
          !origin.swiping &&
          Math.abs(dy) > 10 &&
          Math.abs(dy) >= Math.abs(dx)
        ) {
          reset()
          return
        }
        if (!origin.swiping && dx > 12 && dx > Math.abs(dy) * 1.5) {
          origin.swiping = true
          event.currentTarget.setPointerCapture(event.pointerId)
        }
        if (!origin.swiping) return
        consumed.current = true
        distance.current = Math.max(0, Math.min(dx, 84))
        setOffset(distance.current)
      },
      onPointerUp(): void {
        if (distance.current >= 56) {
          void hapticFeedback.selection()
          onReply()
        }
        reset()
      },
      onPointerCancel: reset,
      onPointerLeave(): void {
        if (!start.current?.swiping) reset()
      },
      onContextMenu(event: React.MouseEvent<HTMLButtonElement>): void {
        event.preventDefault()
        clearHold()
        if (!consumed.current) onHold()
        consumed.current = true
      },
      onClick(event: React.MouseEvent<HTMLButtonElement>): void {
        // Keyboard and assistive activation expose the same actions as holding.
        if (event.detail === 0 && !consumed.current) onHold()
        consumed.current = false
      },
    },
  }
}
