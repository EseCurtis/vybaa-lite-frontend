// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AppLayout } from './app-layout.component'

const state = vi.hoisted(() => ({ pathname: '/app/goal', web: true }))
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: state.pathname }),
  Outlet: () => <main>Route content</main>,
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ isAuthenticated: true, stale: false }),
}))
vi.mock('@/shared/constants.shared', () => ({
  get IS_WEB() {
    return state.web
  },
}))
vi.mock('@/components/common/connection-notice.component', () => ({
  ConnectionNotice: () => null,
}))
vi.mock('@/components/common/startup-handoff.component', () => ({
  StartupHandoff: () => null,
}))
vi.mock('@/components/custom/onboarding/app-walkthrough.component', () => ({
  AppWalkthrough: () => null,
}))
vi.mock('@/components/layout/app/tab-bar.component', () => ({
  TabBar: () => <nav aria-label="Main tabs" />,
}))

afterEach(cleanup)

it.each([true, false])(
  'hides tabs on the entire task stack on web=%s',
  (web) => {
    state.web = web
    for (const pathname of [
      '/app/goal',
      '/app/goal/',
      '/app/goal/create',
      '/app/goal/task-123',
    ]) {
      state.pathname = pathname
      const view = render(<AppLayout />)
      expect(screen.queryByRole('navigation', { name: 'Main tabs' })).toBeNull()
      expect(screen.getByText('Route content')).toBeTruthy()
      view.unmount()
    }
  },
)

it.each([true, false])('preserves tabs on main screens on web=%s', (web) => {
  state.web = web
  for (const pathname of [
    '/app/home',
    '/app/actions/flexx',
    '/app/rewind-chats',
    '/app/profile',
  ]) {
    state.pathname = pathname
    const view = render(<AppLayout />)
    expect(screen.getByRole('navigation', { name: 'Main tabs' })).toBeTruthy()
    view.unmount()
  }
})
