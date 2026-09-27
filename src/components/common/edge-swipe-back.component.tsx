import { RiArrowRightSLine } from '@remixicon/react'
import {
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react'

import { View } from '@/components/layout/view.component'
import { hapticFeedback } from '@/shared/haptic.util'
import { cn } from '@/shared/utils/helpers.util'

const EDGE_ACTIVATION_WIDTH = 28
const HORIZONTAL_ACTIVATION_DISTANCE = 12
const SWIPE_BACK_DISTANCE = 72
const VERTICAL_CANCEL_DISTANCE = 16

type EdgeSwipeState = {
  offset: number
  pointerId: number
  startX: number
  startY: number
  swiping: boolean
}

export function EdgeSwipeBack({
  children,
  className,
  onBack,
}: {
  children: ReactNode
  className?: string
  onBack: () => void
}): ReactElement {
  const gestureRef = useRef<EdgeSwipeState | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  function resetGesture(): void {
    gestureRef.current = null
    setDragOffset(0)
    setIsDragging(false)
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      event.pointerType === 'mouse' ||
      event.clientX > EDGE_ACTIVATION_WIDTH
    ) {
      return
    }

    event.stopPropagation()
    gestureRef.current = {
      offset: 0,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      swiping: false,
    }
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    event.stopPropagation()
    const horizontalDistance = event.clientX - gesture.startX
    const verticalDistance = event.clientY - gesture.startY

    if (
      !gesture.swiping &&
      Math.abs(verticalDistance) > VERTICAL_CANCEL_DISTANCE &&
      Math.abs(verticalDistance) >= Math.abs(horizontalDistance)
    ) {
      resetGesture()
      return
    }

    if (
      !gesture.swiping &&
      horizontalDistance > HORIZONTAL_ACTIVATION_DISTANCE &&
      horizontalDistance > Math.abs(verticalDistance) * 1.5
    ) {
      gesture.swiping = true
      setIsDragging(true)
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    if (!gesture.swiping) return

    event.preventDefault()
    const nextOffset = Math.max(
      0,
      Math.min(horizontalDistance, window.innerWidth),
    )
    gesture.offset = nextOffset
    setDragOffset(nextOffset)
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return

    event.stopPropagation()
    const shouldNavigateBack =
      gesture.swiping && gesture.offset >= SWIPE_BACK_DISTANCE
    resetGesture()

    if (shouldNavigateBack) {
      void hapticFeedback.light()
      onBack()
    }
  }

  const indicatorProgress = Math.min(1, dragOffset / SWIPE_BACK_DISTANCE)

  return (
    <View
      className={cn(
        'relative min-h-0 flex-1 overflow-hidden bg-cardd touch-pan-y',
        className,
      )}
      data-testid="edge-swipe-back"
      onPointerCancelCapture={resetGesture}
      onPointerDownCapture={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUpCapture={handlePointerUp}
    >
      <View
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-16 items-center justify-center bg-card-light-50"
        style={{ opacity: indicatorProgress }}
      >
        <View className="size-11 items-center justify-center rounded-full bg-white">
          <RiArrowRightSLine className="text-cardd" size={25} />
        </View>
      </View>
      <View
        className={cn(
          'min-h-0 flex-1 bg-cardd',
          !isDragging && 'transition-transform duration-200 ease-out',
          'motion-reduce:transition-none',
        )}
        style={
          dragOffset
            ? { transform: `translate3d(${dragOffset}px, 0, 0)` }
            : undefined
        }
      >
        {children}
      </View>
    </View>
  )
}
