// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { hasCompletedWalkthrough } from '@/shared/onboarding/walkthrough.util'
import { AppWalkthrough } from './app-walkthrough.component'

vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: { id: 'owner' } }),
}))
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/app/home' }),
}))
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => new DOMRect(20, 80, 200, 44),
  )
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: true })),
  )
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView
  document.documentElement.style.removeProperty('--safe-area-inset-top')
  document.documentElement.style.removeProperty('--safe-area-inset-bottom')
})

function tour(includeRewind = true) {
  return render(
    <>
      <button data-testid="home-action-my-tasks">Tasks</button>
      {includeRewind ? (
        <button data-testid="home-action-rewind-w/-ella">Rewind</button>
      ) : null}
      <nav data-walkthrough="main-navigation">Main tabs</nav>
      <AppWalkthrough />
    </>,
  )
}

it('uses current targets, supports skipping and does not replay after navigating away', () => {
  const view = tour()
  act(() => vi.advanceTimersByTime(120))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByText('Your everyday tasks')).toBeTruthy()
  expect(hasCompletedWalkthrough('home-main', 'owner')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Next walkthrough step' }))
  expect(screen.getByText('A moment to Rewind')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Skip walkthrough' }))
  expect(screen.queryByRole('dialog')).toBeNull()
  view.unmount()
  tour()
  act(() => vi.advanceTimersByTime(4000))
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('shows available steps rather than silently failing when an optional target is absent', () => {
  tour(false)
  act(() => vi.advanceTimersByTime(3200))
  expect(screen.getByRole('dialog')).toBeTruthy()
  expect(screen.getByText('1 of 2')).toBeTruthy()
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
  expect(screen.queryByRole('dialog')).toBeNull()
})

it('keeps measured tall explanations inside a narrow screen and focuses without moving the target', () => {
  vi.stubGlobal('innerWidth', 320)
  vi.stubGlobal('innerHeight', 568)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.getAttribute('role') === 'dialog')
        return new DOMRect(16, 16, 288, 400)
      return new DOMRect(20, 250, 200, 44)
    },
  )
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  tour()
  act(() => vi.advanceTimersByTime(120))
  const dialog = screen.getByRole('dialog')
  expect(Number(dialog.style.top.replace('px', ''))).toBeGreaterThanOrEqual(16)
  expect(Number(dialog.style.top.replace('px', '')) + 400).toBeLessThanOrEqual(
    552,
  )
  expect(dialog.style.width).toBe('288px')
  expect(focus).toHaveBeenLastCalledWith({ preventScroll: true })
  expect(dialog.querySelector('.overflow-y-auto')).toBeTruthy()
  expect(
    screen
      .getByRole('button', { name: 'Next walkthrough step' })
      .closest('.overflow-y-auto'),
  ).toBeNull()
})

it('reveals an off-screen target before highlighting it and clips oversized sections to their scroller', () => {
  let revealed = false
  vi.stubGlobal('innerWidth', 320)
  vi.stubGlobal('innerHeight', 568)
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.dataset.testid === 'tour-scroll')
        return new DOMRect(20, 100, 220, 200)
      if (this.dataset.testid === 'home-action-my-tasks')
        return new DOMRect(20, revealed ? 80 : 900, 200, 600)
      return new DOMRect(20, 80, 200, 44)
    },
  )
  HTMLElement.prototype.scrollIntoView = vi.fn(function () {
    revealed = true
  })
  render(
    <>
      <div data-testid="tour-scroll" style={{ overflow: 'auto' }}>
        <button data-testid="home-action-my-tasks">Tasks</button>
      </div>
      <button data-testid="home-action-rewind">Rewind</button>
      <nav data-walkthrough="main-navigation">Tabs</nav>
      <AppWalkthrough />
    </>,
  )
  act(() => vi.advanceTimersByTime(120))
  expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
    behavior: 'auto',
    block: 'center',
    inline: 'nearest',
  })
  const spotlight = document.querySelector<HTMLElement>(
    '[data-walkthrough-spotlight]',
  )
  expect(spotlight?.style.top).toBe('92px')
  expect(spotlight?.style.height).toBe('216px')
  expect(screen.getByRole('dialog')).toBeTruthy()
})

it('repositions on visual viewport changes and respects native safe areas without stealing focus again', () => {
  const viewport = Object.assign(new EventTarget(), {
    offsetLeft: 0,
    offsetTop: 200,
    width: 320,
    height: 350,
  })
  vi.stubGlobal('visualViewport', viewport)
  document.documentElement.style.setProperty('--safe-area-inset-top', '24px')
  document.documentElement.style.setProperty('--safe-area-inset-bottom', '20px')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: HTMLElement) {
      if (this.getAttribute('role') === 'dialog')
        return new DOMRect(16, 240, 288, 250)
      return new DOMRect(20, 360, 200, 44)
    },
  )
  const focus = vi.spyOn(HTMLElement.prototype, 'focus')
  tour()
  act(() => vi.advanceTimersByTime(120))
  expect(screen.getByRole('dialog').style.maxHeight).toBe('274px')
  const initialCalls = focus.mock.calls.length
  viewport.height = 280
  act(() => {
    viewport.dispatchEvent(new Event('resize'))
    vi.advanceTimersByTime(32)
  })
  expect(screen.getByRole('dialog').style.maxHeight).toBe('204px')
  expect(screen.getByRole('dialog').style.top).toBe('240px')
  expect(focus).toHaveBeenCalledTimes(initialCalls)
})

it('tracks scrolling and resize observations, and releases both when dismissed', () => {
  const disconnect = vi.fn()
  const callbacks: ResizeObserverCallback[] = []
  class Observer {
    public constructor(callback: ResizeObserverCallback) {
      callbacks.push(callback)
    }
    public observe = vi.fn()
    public disconnect = disconnect
  }
  vi.stubGlobal('ResizeObserver', Observer)
  const viewport = Object.assign(new EventTarget(), {
    offsetLeft: 0,
    offsetTop: 0,
    width: 320,
    height: 568,
  })
  const remove = vi.spyOn(viewport, 'removeEventListener')
  vi.stubGlobal('visualViewport', viewport)
  const view = tour()
  act(() => vi.advanceTimersByTime(120))
  expect(callbacks.length).toBeGreaterThanOrEqual(2)
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  const request = vi.spyOn(window, 'requestAnimationFrame')
  viewport.dispatchEvent(new Event('scroll'))
  const pendingFrame = request.mock.results[0]?.value
  fireEvent.click(screen.getByRole('button', { name: 'Skip walkthrough' }))
  expect(cancel).toHaveBeenCalledWith(pendingFrame)
  expect(disconnect).toHaveBeenCalledTimes(2)
  expect(remove).toHaveBeenCalledWith('resize', expect.any(Function))
  expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  view.unmount()
})
