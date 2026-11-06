// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StrictMode } from 'react'

import { ApiError } from '@/shared/api/http'

import AppScreen from './index.screen'

const controls = vi.hoisted(() => ({
  authenticated: false,
  loading: false,
  stale: false,
  error: null as string | null,
  googleStatus: 'idle' as 'idle' | 'opening-google',
  toastError: vi.fn(),
  navigate: vi.fn(),
  afterAuth: vi.fn(),
  google: vi.fn(),
  apple: vi.fn(),
  legal: vi.fn(),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    appleAuthStatus: 'idle',
    googleAuthStatus: controls.googleStatus,
    isAuthenticated: controls.authenticated,
    isLoading: controls.loading,
    stale: controls.stale,
    error: controls.error,
    loginWithApple: controls.apple,
    loginWithGoogle: controls.google,
    user: controls.authenticated ? { id: 'owner' } : null,
  }),
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ error: controls.toastError }),
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
  controls.error = null
  controls.googleStatus = 'idle'
  controls.google.mockResolvedValue(undefined)
  controls.apple.mockResolvedValue(undefined)
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

it('caps the splash action tiles even as the customizable Home catalog grows', () => {
  const view = render(<AppScreen />)
  expect(
    [...view.container.querySelectorAll('[data-splash-action]')].map((tile) =>
      tile.getAttribute('data-splash-action'),
    ),
  ).toEqual(['flexx', 'tasks', 'rewind', 'wellbeing'])
  expect(
    view.container.querySelector('[data-splash-action="journal"]'),
  ).toBeNull()
})

it('retains retryable sign-in errors and never replays onboarding for a signed-in user', async () => {
  controls.google.mockRejectedValueOnce(new Error('Network unavailable'))
  const view = render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  await waitFor(() =>
    expect(controls.toastError).toHaveBeenCalledWith(
      'Couldn’t connect. Check your internet and try again.',
    ),
  )
  expect(screen.queryByText('Network unavailable')).toBeNull()
  controls.authenticated = true
  view.rerender(<AppScreen />)
  expect(screen.queryByText('Make room for your day.')).toBeNull()
  await waitFor(() => expect(controls.afterAuth).toHaveBeenCalled())
})

it('shows provider errors once as a toast, never as an inline pill, including Strict Mode replays', () => {
  controls.error = 'Couldn’t restore your session. Please sign in again.'
  const view = render(
    <StrictMode>
      <AppScreen />
    </StrictMode>,
  )
  expect(controls.toastError).toHaveBeenCalledExactlyOnceWith(
    'Couldn’t log in right now. Please try again.',
  )
  expect(screen.queryByText(controls.error)).toBeNull()
  view.rerender(
    <StrictMode>
      <AppScreen />
    </StrictMode>,
  )
  expect(controls.toastError).toHaveBeenCalledTimes(1)
})

it('does not duplicate an error shared by the auth provider and the failed sign-in promise', async () => {
  let rejectSignIn: (error: Error) => void = () => {
    throw new Error('Sign-in promise was not initialized')
  }
  controls.google.mockReturnValueOnce(
    new Promise<void>((_, reject) => {
      rejectSignIn = reject
    }),
  )
  const view = render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  controls.error = 'Network unavailable'
  view.rerender(<AppScreen />)
  expect(controls.toastError).not.toHaveBeenCalled()
  await act(async () => {
    rejectSignIn(new Error('Network unavailable'))
  })
  await waitFor(() => expect(controls.google).toHaveBeenCalledTimes(1))
  await waitFor(() => expect(controls.toastError).toHaveBeenCalledTimes(1))
  expect(screen.queryByText('Network unavailable')).toBeNull()
})

it('allows the same error to toast again when a new sign-in attempt fails', async () => {
  controls.google.mockRejectedValue(new Error('Network unavailable'))
  render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  await waitFor(() => expect(controls.toastError).toHaveBeenCalledTimes(1))
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  await waitFor(() => expect(controls.toastError).toHaveBeenCalledTimes(2))
  expect(screen.queryByText('Network unavailable')).toBeNull()
})

it('uses an error toast for Apple failures and safe fallback text for non-Error rejections', async () => {
  controls.apple.mockRejectedValueOnce({ code: 'UNKNOWN' })
  render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }))
  await waitFor(() =>
    expect(controls.toastError).toHaveBeenCalledWith(
      'Couldn’t sign in with Apple. Please try again or use email.',
    ),
  )
  expect(screen.queryByText('Failed to sign in with Apple')).toBeNull()
})

it('retains informational sign-in status without using the error toast', () => {
  controls.loading = true
  controls.googleStatus = 'opening-google'
  render(<AppScreen />)
  expect(screen.getByText('Opening Google account picker...')).toBeTruthy()
  expect(controls.toastError).not.toHaveBeenCalled()
})

it.each([
  [
    new Error(
      'OAuth SDK failed: id_token=private-token client_secret=private-secret',
    ),
    'Couldn’t sign in with Google. Please try again or use email.',
  ],
  [
    new ApiError('Prisma failure: database password=private-secret', {
      status: 500,
    }),
    'We’re having trouble right now. Please try again shortly.',
  ],
  [
    new ApiError('Provider rate limit details', { status: 429 }),
    'Too many attempts. Wait a little, then try again.',
  ],
  [
    new Error('Google account picker was dismissed'),
    'Sign-in was cancelled. Try again when you’re ready.',
  ],
  [
    new Error('Request timed out at internal-host'),
    'That took too long. Please try again.',
  ],
])('maps %s to safe actionable sign-in wording', async (failure, message) => {
  controls.google.mockRejectedValueOnce(failure)
  const view = render(<AppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
  await waitFor(() =>
    expect(controls.toastError).toHaveBeenCalledExactlyOnceWith(message),
  )
  expect(view.container.textContent).not.toContain(failure.message)
  expect(JSON.stringify(controls.toastError.mock.calls)).not.toMatch(
    /private-token|private-secret|Prisma|internal-host/u,
  )
})
