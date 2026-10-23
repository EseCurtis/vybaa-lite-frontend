// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import AppScreen from './index.screen'

const controls = vi.hoisted(() => ({
  authenticated: false,
  loading: false,
  stale: false,
  navigate: vi.fn(),
  afterAuth: vi.fn(),
  google: vi.fn(),
  apple: vi.fn(),
  legal: vi.fn(),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    appleAuthStatus: 'idle',
    googleAuthStatus: 'idle',
    isAuthenticated: controls.authenticated,
    isLoading: controls.loading,
    stale: controls.stale,
    error: null,
    loginWithApple: controls.apple,
    loginWithGoogle: controls.google,
    user: controls.authenticated ? { id: 'owner' } : null,
  }),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => controls.navigate,
  useRouter: () => ({ navigate: controls.navigate }),
}))
vi.mock('@/env', () => ({
  default: {
    PLATFORM: 'ios',
    PLATFORMS: { IOS: 'ios', ANDROID: 'android', WEB: 'web' },
  },
}))
vi.mock('@/shared/utils/auth-platform.util', () => ({
  isAppleLoginAvailable: () => true,
  isGoogleLoginAvailable: () => true,
}))
vi.mock('@/shared/utils/auth-redirect.util', () => ({
  navigateAfterAuth: controls.afterAuth,
}))
vi.mock('@capacitor/browser', () => ({ Browser: { open: controls.legal } }))
vi.mock('@/components/common/app-loading-state.component', () => ({
  AppLoadingState: () => <div role="status">Restoring session</div>,
}))
vi.mock('framer-motion', async (original) => ({
  ...(await original<typeof import('framer-motion')>()),
  useReducedMotion: () => true,
}))

beforeEach(() => {
  vi.clearAllMocks()
  controls.authenticated = false
  controls.loading = false
  controls.stale = false
  controls.google.mockResolvedValue(undefined)
})
afterEach(cleanup)

it('does not mount the animated welcome screen while the initial session is unresolved', () => {
  controls.stale = true
  render(<AppScreen />)
  expect(screen.getByRole('status')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Get started' })).toBeNull()
  expect(screen.queryByText('Make room for your day.')).toBeNull()
  expect(screen.queryByTestId('splash-partners')).toBeNull()
})

it('keeps sign-in immediately usable and preserves Apple, Google, email and legal actions', () => {
  const view = render(<AppScreen />)
  expect(screen.getByText(/You, Reflect\. Reset\./)).toBeTruthy()
  expect(
    screen.getByText(
      'Journal your days. Rewind your thoughts. Reach your goals.',
    ),
  ).toBeTruthy()
  expect(view.container.querySelector('[data-welcome-partner]')).toBeNull()
  const partners = screen.getByTestId('splash-partners')
  expect(partners.getAttribute('aria-hidden')).toBe('true')
  expect(partners.classList.contains('pointer-events-none')).toBe(true)
  expect(partners.querySelectorAll('img')).toHaveLength(6)
  fireEvent.click(screen.getByRole('button', { name: 'Get started' }))
  expect(controls.navigate).toHaveBeenCalledWith({ to: '/auth/login' })
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }))
  fireEvent.click(screen.getByRole('button', { name: 'Read Privacy Policy' }))
  expect(controls.google).toHaveBeenCalledOnce()
  expect(controls.apple).toHaveBeenCalledOnce()
  expect(controls.legal).toHaveBeenCalledOnce()
})

it('retains retryable sign-in errors and never replays onboarding for a signed-in user', async () => {
  controls.google.mockRejectedValueOnce(new Error('Network unavailable'))
  const view = render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  expect(await screen.findByText('Network unavailable')).toBeTruthy()
  controls.authenticated = true
  view.rerender(<AppScreen />)
  expect(screen.queryByText('Make room for your day.')).toBeNull()
  await waitFor(() => expect(controls.afterAuth).toHaveBeenCalled())
})
