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
