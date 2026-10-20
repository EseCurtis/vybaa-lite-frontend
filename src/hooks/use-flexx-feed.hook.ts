import { useReducedMotion } from 'framer-motion'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'

function postHeight(feed: HTMLDivElement): number {
  return (
    feed.querySelector<HTMLElement>('[data-flexx-post]')?.offsetHeight ||
    feed.clientHeight
  )
}

export function useFlexxFeed(
  count: number,
  initialIndex: number,
  resetKey?: string,
  reducedMotionOverride?: boolean,
): {
  activeIndex: number
  feedRef: RefObject<HTMLDivElement | null>
  goTo: (index: number) => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onScroll: () => void
} {
  const feedRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const activeRef = useRef(initialIndex)
  const frameRef = useRef<number | null>(null)
  const systemReducedMotion = useReducedMotion()
  const reduceMotion = reducedMotionOverride ?? systemReducedMotion
  useLayoutEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    activeRef.current = initialIndex
    setActiveIndex(initialIndex)
    const align = (): void => {
      feed.scrollTop = postHeight(feed) * activeRef.current
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(feed)
    return () => {
      observer.disconnect()
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }, [initialIndex, resetKey])
  const onScroll = useCallback((): void => {
    if (frameRef.current !== null) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null
      const feed = feedRef.current
      if (!feed?.clientHeight) return
      const next = Math.max(
        0,
        Math.min(
          count - 1,
          Math.floor(
            (feed.scrollTop + feed.clientHeight / 2) / postHeight(feed),
          ),
        ),
      )
      if (next === activeRef.current) return
      activeRef.current = next
      setActiveIndex(next)
    })
  }, [count])
  const goTo = useCallback(
    (index: number): void => {
      const feed = feedRef.current
      if (!feed) return
      const next = Math.max(0, Math.min(count - 1, index))
      feed.scrollTo({
        top: next * postHeight(feed),
        behavior: reduceMotion ? 'instant' : 'smooth',
      })
    },
    [count, reduceMotion],
  )
  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>): void => {
      if (event.target !== event.currentTarget) return
      let next: number
      switch (event.key) {
        case 'ArrowDown':
        case 'PageDown':
          next = activeRef.current + 1
          break
        case 'ArrowUp':
        case 'PageUp':
          next = activeRef.current - 1
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = count - 1
          break
        default:
          return
      }
      event.preventDefault()
      goTo(next)
    },
    [count, goTo],
  )
  return { activeIndex, feedRef, goTo, onKeyDown, onScroll }
}
