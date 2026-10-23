// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useFlexxFeed } from './use-flexx-feed.hook'

const motion = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', () => ({ useReducedMotion: () => motion.reduced }))
let resize: (() => void) | undefined
let height = 600
const disconnect = vi.fn()
const scrollTo = vi.fn()
const originalScrollTo = Object.getOwnPropertyDescriptor(
  Element.prototype,
  'scrollTo',
)

beforeEach(() => {
  vi.useFakeTimers()
  motion.reduced = false
  height = 600
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockImplementation(
    () => height,
  )
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe(): void {}
      disconnect = disconnect
    },
  )
  Object.defineProperty(Element.prototype, 'scrollTo', {
    configurable: true,
    value: scrollTo,
  })
})
afterEach(() => {
  cleanup()
  if (originalScrollTo)
    Object.defineProperty(Element.prototype, 'scrollTo', originalScrollTo)
  else Reflect.deleteProperty(Element.prototype, 'scrollTo')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.useRealTimers()
})

function Feed({
  initial = 0,
  count = 5,
  ids,
}: {
  initial?: number
  count?: number
  ids?: readonly string[]
}) {
  const feed = useFlexxFeed(count, initial, undefined, undefined, ids)
  return (
    <div
      ref={feed.feedRef}
      role="region"
      tabIndex={0}
      onScroll={feed.onScroll}
      onKeyDown={feed.onKeyDown}
    >
      <div data-flexx-post />
      <output>{feed.activeIndex}</output>
      <button onClick={() => feed.goTo(4)}>Last</button>
    </div>
  )
}

it('opens the recommended post and preserves its position when the viewport resizes', () => {
  render(<Feed initial={3} />)
  const region = screen.getByRole('region')
  expect(region.scrollTop).toBe(1800)
  height = 400
  act(() => resize?.())
  expect(region.scrollTop).toBe(1200)
})

it('coalesces scroll events and updates only to the nearest bounded post', () => {
  render(<Feed />)
  const region = screen.getByRole('region')
  region.scrollTop = 920
  fireEvent.scroll(region)
  fireEvent.scroll(region)
  act(() => vi.advanceTimersByTime(20))
  expect(screen.getByRole('status').textContent).toBe('2')
  region.scrollTop = 5000
  fireEvent.scroll(region)
  act(() => vi.advanceTimersByTime(20))
  expect(screen.getByRole('status').textContent).toBe('4')
})

it('uses actual post height in short viewports so tall cards stay readable', () => {
  height = 130
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(680)
  render(<Feed initial={1} />)
  const region = screen.getByRole('region')
  expect(region.scrollTop).toBe(680)
  region.scrollTop = 500
  fireEvent.scroll(region)
  act(() => vi.advanceTimersByTime(20))
  expect(screen.getByRole('status').textContent).toBe('0')
  fireEvent.click(screen.getByRole('button'))
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 2720, behavior: 'smooth' })
})

it('supports keyboard navigation without taking arrow keys away from controls', () => {
  render(<Feed />)
  fireEvent.keyDown(screen.getByRole('region'), { key: 'PageDown' })
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 600, behavior: 'smooth' })
  fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowDown' })
  expect(scrollTo).toHaveBeenCalledTimes(1)
  fireEvent.keyDown(screen.getByRole('region'), { key: 'End' })
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 2400, behavior: 'smooth' })
})

it('uses instant navigation for reduced motion and cleans up observers and pending frames', () => {
  motion.reduced = true
  const view = render(<Feed />)
  fireEvent.click(screen.getByRole('button'))
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 2400, behavior: 'instant' })
  fireEvent.scroll(screen.getByRole('region'))
  view.unmount()
  expect(disconnect).toHaveBeenCalledOnce()
  act(() => vi.advanceTimersByTime(20))
})

it('keeps the active index in range when empty posts are filtered out', () => {
  const view = render(<Feed initial={4} />)
  const region = screen.getByRole('region')
  view.rerender(<Feed initial={4} count={2} />)
  expect(screen.getByRole('status').textContent).toBe('1')
  expect(region.scrollTop).toBe(600)
  view.rerender(<Feed initial={4} count={0} />)
  expect(screen.getByRole('status').textContent).toBe('0')
  expect(region.scrollTop).toBe(0)
})

it('retains the visible post when an earlier empty post is removed', () => {
  const view = render(<Feed initial={2} count={4} ids={['a', 'b', 'c', 'd']} />)
  view.rerender(<Feed initial={2} count={3} ids={['a', 'c', 'd']} />)
  expect(screen.getByRole('status').textContent).toBe('1')
  expect(screen.getByRole('region').scrollTop).toBe(600)
})
