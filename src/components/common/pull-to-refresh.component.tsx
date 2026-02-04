import { Text } from '@/components/layout/text.component'
import { useEffect, useRef, useState } from 'react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  refreshing?: boolean
  className?: string
  pullThreshold?: number // Distance to pull before refresh triggers
  disabled?: boolean
}

/**
 * Pull-to-refresh component for web
 * Works with both touch and mouse interactions
 * Wraps a scrollable container and adds pull-to-refresh functionality
 */
export function PullToRefresh({
  children,
  onRefresh,
  refreshing = false,
  className = '',
  pullThreshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const [startY, setStartY] = useState(0)
  const isRefreshingRef = useRef(false)

  // Reset pull state after refresh completes
  useEffect(() => {
    if (!refreshing && isRefreshingRef.current) {
      isRefreshingRef.current = false
      setPullDistance(0)
      setIsPulling(false)
    }
    if (refreshing) {
      isRefreshingRef.current = true
    }
  }, [refreshing])

  useEffect(() => {
    const container = containerRef.current
    if (!container || disabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || refreshing) return
      const scrollTop = container.scrollTop
      // Only allow pull if at the top
      if (scrollTop === 0) {
        setStartY(e.touches[0].clientY)
        setIsPulling(true)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || disabled || refreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY

      // Only allow pulling down
      if (distance > 0 && container.scrollTop === 0) {
        // Prevent default scrolling when pulling
        e.preventDefault()
        const newDistance = Math.min(distance * 0.6, pullThreshold * 1.5) // Damping effect
        setPullDistance(newDistance)
      } else if (distance <= 0) {
        setPullDistance(0)
        setIsPulling(false)
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling || disabled || refreshing) return

      if (pullDistance >= pullThreshold) {
        // Trigger refresh
        const refreshPromise = onRefresh()
        if (refreshPromise instanceof Promise) {
          refreshPromise.catch(() => {
            // Error handling is done by the caller
          })
        }
      } else {
        // Reset if not pulled far enough
        setPullDistance(0)
      }
      setIsPulling(false)
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isPulling, startY, pullDistance, pullThreshold, disabled, refreshing, onRefresh])

  // Calculate refresh indicator opacity and rotation
  const refreshIndicatorOpacity = Math.min(pullDistance / pullThreshold, 1)
  const shouldShowIndicator = pullDistance > 0 || refreshing
  const isReadyToRefresh = pullDistance >= pullThreshold && !refreshing

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Refresh Indicator */}
      {shouldShowIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center z-50 pointer-events-none"
          style={{
            transform: `translateY(${Math.max(0, pullDistance - 60)}px)`,
            opacity: refreshIndicatorOpacity,
            transition: 'opacity 0.2s ease-out',
          }}
        >
          <div className="flex items-center gap-2 py-2">
            {refreshing ? (
              <>
                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white w-5 h-5" />
                <Text className="text-white/80 text-sm font-bbh">Refreshing...</Text>
              </>
            ) : (
              <>
                <div
                  className="w-5 h-5 border-2 border-white/60 rounded-full flex items-center justify-center"
                  style={{
                    transform: `rotate(${pullDistance * 2}deg)`,
                  }}
                >
                  <div className="w-2 h-2 bg-white/60 rounded-full" />
                </div>
                <Text className="text-white/80 text-sm font-bbh">
                  {isReadyToRefresh ? 'Release to refresh' : 'Pull to refresh'}
                </Text>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content with pull transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: refreshing ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  )
}

