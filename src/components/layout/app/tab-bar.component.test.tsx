// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { TabBar } from './tab-bar.component'

vi.mock('@/hooks/use-notifications.hook', () => ({
  useUnreadCount: () => ({ data: 0 }),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: undefined }),
}))
vi.mock('@/providers/tab-bar.provider', () => ({
  useTabBarController: () => ({ isVisible: true }),
}))
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/app/home' }),
  useNavigate: () => vi.fn(),
}))

afterEach(cleanup)

it('keeps the primary plus centered between Flexx and Rewind Chats', () => {
  render(<TabBar />)

  const grid = screen.getByTestId('tab-home').parentElement?.parentElement
  if (!grid) throw new Error('Main tab grid is missing')
  expect(grid.classList.contains('grid-cols-5')).toBe(true)
  expect(
    Array.from(grid.children).map((slot) =>
      slot.querySelector('button')?.getAttribute('data-testid'),
    ),
  ).toEqual([
    'tab-home',
    'tab-flexx',
    'tab-create-goal',
    'tab-rewind-chats',
    'tab-profile',
  ])
  expect(screen.getByTestId('tab-create-goal').getAttribute('aria-label')).toBe(
    'Create a new task',
  )
  expect(screen.getByTestId('tab-home').getAttribute('aria-pressed')).toBe(
    'true',
  )
  expect(screen.getByTestId('tab-flexx').getAttribute('aria-pressed')).toBe(
    'false',
  )
})
