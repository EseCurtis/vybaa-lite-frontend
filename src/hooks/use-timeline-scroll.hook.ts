import { useEffect, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

export function timelineScrollParent(element: HTMLElement): HTMLElement {
  let parent = element.parentElement
  while (parent) {
    if (/(auto|scroll)/.test(getComputedStyle(parent).overflowY)) return parent
    parent = parent.parentElement
  }
  return document.documentElement
}

interface TimelineScrollOptions {
  active: boolean
  firstId?: string
  fetching: boolean
  hasBefore: boolean
  hasAfter: boolean
  beforeFailed: boolean
  afterFailed: boolean
  loadBefore: () => Promise<unknown>
  loadAfter: () => Promise<unknown>
}

export function useTimelineScroll(
  content: RefObject<HTMLElement | null>,
  options: TimelineScrollOptions,
) {
  const current = useRef(options)
  current.current = options
  const snapshot = useRef<{
    id: string | null
    top: number
    scrollTop: number
  } | null>(null)
  const loader = useRef<
    (direction: 'after' | 'before', retry?: boolean) => Promise<void>
  >(async () => undefined)
  const busy = useRef(false)
  const root = useRef<HTMLElement | null>(null)
  const savedScroll = useRef<number | null>(null)

  useLayoutEffect(() => {
    const old = snapshot.current
    if (!old || !root.current) return
    const element = old.id
      ? Array.from(
          content.current?.querySelectorAll<HTMLElement>(
            '[data-occurrence-id]',
          ) ?? [],
        ).find((row) => row.dataset.occurrenceId === old.id)
      : content.current?.querySelector<HTMLElement>('[data-timeline-today]')
    if (element)
      root.current.scrollTop +=
        element.getBoundingClientRect().top -
        old.top +
        (root.current.scrollTop - old.scrollTop)
    snapshot.current = null
  }, [content, options.firstId])

  useEffect(() => {
    const element = content.current
    if (!options.active || !element) return
    const scroll = timelineScrollParent(element)
    root.current = scroll
    const previousAnchoring = scroll.style.overflowAnchor
    scroll.style.overflowAnchor = 'none'
    if (savedScroll.current !== null) scroll.scrollTop = savedScroll.current
    let intent: 'after' | 'before' | null = null
    let touchY = 0
    async function load(
      direction: 'after' | 'before',
      retry = false,
    ): Promise<void> {
      const state = current.current
      if (
        busy.current ||
        state.fetching ||
        (direction === 'before'
          ? !state.hasBefore || (state.beforeFailed && !retry)
          : !state.hasAfter || (state.afterFailed && !retry))
      )
        return
      busy.current = true
      intent = null
      if (direction === 'before') {
        const firstVisible = Array.from(
          element?.querySelectorAll<HTMLElement>('[data-occurrence-id]') ?? [],
        ).find(
          (row) =>
            row.getBoundingClientRect().bottom >
            scroll.getBoundingClientRect().top,
        )
        const visible =
          firstVisible ??
          element?.querySelector<HTMLElement>('[data-timeline-today]')
        snapshot.current = visible
          ? {
              id: firstVisible?.dataset.occurrenceId ?? null,
              top: visible.getBoundingClientRect().top,
              scrollTop: scroll.scrollTop,
            }
          : null
      }
      try {
        await (direction === 'before' ? state.loadBefore() : state.loadAfter())
      } finally {
        busy.current = false
      }
    }
    loader.current = load
    function checkEdges(): void {
      if (!intent) return
      const edge = element?.querySelector(`[data-timeline-edge="${intent}"]`)
      if (!edge) return
      const bounds = edge.getBoundingClientRect(),
        viewport = scroll.getBoundingClientRect()
      if (
        bounds.bottom >= viewport.top - 100 &&
        bounds.top <= viewport.bottom + 100
      )
        void load(intent)
    }
    function wheel(event: WheelEvent): void {
      intent = event.deltaY < 0 ? 'before' : 'after'
      checkEdges()
    }
    function touchStart(event: TouchEvent): void {
      touchY = event.touches[0]?.clientY ?? 0
    }
    function touchMove(event: TouchEvent): void {
      const nextY = event.touches[0]?.clientY ?? touchY
      if (Math.abs(nextY - touchY) < 5) return
      intent = nextY > touchY ? 'before' : 'after'
      touchY = nextY
      checkEdges()
    }
    function key(event: KeyboardEvent): void {
      if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) intent = 'before'
      else if (['ArrowDown', 'PageDown', 'End'].includes(event.key))
        intent = 'after'
      checkEdges()
    }
    scroll.addEventListener('scroll', checkEdges, { passive: true })
    scroll.addEventListener('wheel', wheel, { passive: true })
    scroll.addEventListener('touchstart', touchStart, { passive: true })
    scroll.addEventListener('touchmove', touchMove, { passive: true })
    scroll.addEventListener('keydown', key)
    return () => {
      loader.current = async () => undefined
      savedScroll.current = scroll.scrollTop
      scroll.style.overflowAnchor = previousAnchoring
      scroll.removeEventListener('scroll', checkEdges)
      scroll.removeEventListener('wheel', wheel)
      scroll.removeEventListener('touchstart', touchStart)
      scroll.removeEventListener('touchmove', touchMove)
      scroll.removeEventListener('keydown', key)
    }
  }, [content, options.active])
  return {
    loadPage: (direction: 'after' | 'before', retry = false) =>
      loader.current(direction, retry),
  }
}
