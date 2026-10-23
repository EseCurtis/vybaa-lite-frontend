// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import LoginScreen from './login.screen'
import SignupScreen from './signup.screen'
import ConfirmAccountScreen from './confirm-account.screen'
import ForgotPasswordScreen from './forgot-password.screen'
import { ApiError } from '@/shared/api/http'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  navigate: vi.fn(),
  confirm: vi.fn(),
  resend: vi.fn(),
  requestReset: vi.fn(),
  reset: vi.fn(),
  checkUsername: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    loginWithEmail: mocks.login,
    registerWithEmail: mocks.register,
  }),
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ success: mocks.success, error: mocks.error }),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mocks.navigate,
  useSearch: () => ({ email: 'jane@example.com' }),
}))
vi.mock('@/shared/api/auth.api', () => ({
  authAPI: {
    confirmAccount: mocks.confirm,
    requestConfirmation: mocks.resend,
    requestPasswordReset: mocks.requestReset,
    resetPassword: mocks.reset,
  },
}))
vi.mock('@/shared/api/user.api', () => ({
  userAPI: { checkUsernameExists: mocks.checkUsername },
}))
vi.mock('@/components/common/auth-screen-layout.component', () => ({
  AuthScreenLayout: ({
    children,
    footer,
  }: {
    children: ReactNode
    footer?: ReactNode
  }) => (
    <>
      {children}
      {footer}
    </>
  ),
}))
vi.mock('@/components/common/notch.component', () => ({
  BottomNotch: () => null,
}))

beforeEach(() => {
  vi.resetAllMocks()
  mocks.checkUsername.mockResolvedValue({ data: { available: true } })
})
afterEach(cleanup)

function enter(label: string, value: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('auth form validation', () => {
  it('shows inline errors and focuses email without calling login', () => {
    render(<LoginScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(mocks.login).not.toHaveBeenCalled()
    expect(screen.getByText('Enter your email address.')).toBeTruthy()
    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
    expect(screen.getByLabelText('Password').getAttribute('aria-invalid')).toBe(
      'true',
    )
    enter('Email', 'jane@example.com')
    expect(screen.queryByText('Enter your email address.')).toBeNull()
  })

  it('keeps existing short passwords usable and redacts server failures', async () => {
    mocks.login.mockRejectedValue(
      new ApiError('Prisma secret=hidden', { status: 500 }),
    )
    render(<LoginScreen />)
    enter('Email', ' jane@example.com ')
    enter('Password', ' old ')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(mocks.login).toHaveBeenCalledWith({
        email: 'jane@example.com',
        password: ' old ',
      }),
    )
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'We’re having trouble right now. Please try again shortly.',
    )
    expect(screen.queryByText(/secret=hidden/)).toBeNull()
  })

  it('preserves the unverified-login route', async () => {
    mocks.login.mockRejectedValue(
      new ApiError('confirm', { code: 'EMAIL_NOT_CONFIRMED', status: 403 }),
    )
    render(<LoginScreen />)
    enter('Email', 'jane@example.com')
    enter('Password', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: '/auth/confirm',
        search: { email: 'jane@example.com' },
      }),
    )
  })

  it('validates confirmation but lets resend work without a code', async () => {
    render(<ConfirmAccountScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Confirm account' }))
    expect(mocks.confirm).not.toHaveBeenCalled()
    expect(
      screen.getByText('Enter the 6-digit code from your email.'),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Request a new code' }))
    await waitFor(() =>
      expect(mocks.resend).toHaveBeenCalledWith('jane@example.com'),
    )
  })

  it('validates reset email, code and new password before making requests', async () => {
    render(<ForgotPasswordScreen />)
    enter('Email', 'wrong')
    fireEvent.click(screen.getByRole('button', { name: 'Send reset code' }))
    expect(mocks.requestReset).not.toHaveBeenCalled()
    enter('Email', 'jane@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Send reset code' }))
    await screen.findByLabelText('Reset code')
    enter('Reset code', '123')
    enter('New password', 'short')
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    expect(mocks.reset).not.toHaveBeenCalled()
    expect(
      screen.getByText('Use at least 8 characters for your password.'),
    ).toBeTruthy()
    enter('Reset code', '123456')
    enter('New password', 'safe password')
    fireEvent.click(screen.getByRole('button', { name: 'Reset password' }))
    await waitFor(() =>
      expect(mocks.reset).toHaveBeenCalledWith({
        email: 'jane@example.com',
        otp: 123456,
        newPassword: 'safe password',
      }),
    )
  })

  it('shows signup errors on submit instead of leaving Continue inexplicably disabled', () => {
    render(<SignupScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.getByText('Enter your first name.')).toBeTruthy()
    expect(screen.getByText('Enter your last name.')).toBeTruthy()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('preserves username checks and validates password confirmation on step two', async () => {
    render(<SignupScreen />)
    enter('Username', 'jane')
    enter('First name', 'Jane')
    enter('Last name', 'Doe')
    enter('Email', 'jane@example.com')
    await screen.findByText('Nice — that username is available')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    enter('Password', 'password123')
    enter('Confirm password', 'different')
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(
      screen.getByText('These passwords don’t match. Try again.'),
    ).toBeTruthy()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('does not advance using availability from a previous username', async () => {
    render(<SignupScreen />)
    enter('Username', 'jane')
    enter('First name', 'Jane')
    enter('Last name', 'Doe')
    enter('Email', 'jane@example.com')
    await screen.findByText('Nice — that username is available')
    enter('Username', 'anothername')
    expect(screen.queryByText('Nice — that username is available')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByLabelText('Confirm password')).toBeNull()
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('blocks resend with an invalid email and surfaces expired codes safely', async () => {
    mocks.confirm.mockRejectedValue(
      new ApiError('OTP has expired', { status: 401 }),
    )
    render(<ConfirmAccountScreen />)
    enter('Email', 'not an email')
    fireEvent.click(screen.getByRole('button', { name: 'Request a new code' }))
    expect(mocks.resend).not.toHaveBeenCalled()
    enter('Email', 'jane@example.com')
    enter('Confirmation code', '123456')
    fireEvent.click(screen.getByRole('button', { name: 'Confirm account' }))
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'That code has expired. Request a new one and try again.',
    )
    expect(screen.getByLabelText('Confirmation code')).toHaveProperty(
      'value',
      '123456',
    )
  })

  it('preserves signup consent, normalization and confirmation navigation', async () => {
    mocks.register.mockResolvedValue({ data: { confirmationRequired: true } })
    render(<SignupScreen />)
    enter('Username', 'jane')
    enter('First name', ' Jane ')
    enter('Last name', ' Doe ')
    enter('Email', ' jane@example.com ')
    await screen.findByText('Nice — that username is available')
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
    enter('Password', ' password123 ')
    enter('Confirm password', ' password123 ')
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    await waitFor(() =>
      expect(mocks.register).toHaveBeenCalledWith(
        expect.objectContaining({
          acceptedTerms: true,
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          username: 'jane',
          password: ' password123 ',
        }),
      ),
    )
    await waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith({
        to: '/auth/confirm',
        search: { email: 'jane@example.com' },
      }),
    )
  })
})
