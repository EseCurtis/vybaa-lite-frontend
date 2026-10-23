import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/http'
import { getAuthErrorMessage, validateAuthFields } from './auth-validation.util'

describe('auth field validation', () => {
  it('identifies blank and malformed fields without changing passwords', () => {
    expect(
      validateAuthFields({
        email: '  ',
        password: '',
        firstName: ' ',
        lastName: '',
      }),
    ).toEqual({
      email: 'Enter your email address.',
      password: 'Enter your password.',
      firstName: 'Enter your first name.',
      lastName: 'Enter your last name.',
    })
    expect(validateAuthFields({ email: 'not-an-email' }).email).toBeTruthy()
    expect(
      validateAuthFields({ email: ' jane+tag@example.com ', password: 'old' }),
    ).toEqual({})
  })

  it('matches backend password limits only for new passwords', () => {
    for (const length of [0, 7, 101])
      expect(
        validateAuthFields({ password: 'x'.repeat(length) }, true).password,
      ).toBeTruthy()
    for (const length of [8, 100])
      expect(
        validateAuthFields({ password: 'x'.repeat(length) }, true),
      ).toEqual({})
    expect(
      validateAuthFields(
        { password: ' password ', confirmPassword: 'password' },
        true,
      ).confirmPassword,
    ).toBeTruthy()
  })

  it.each(['', '123', '1234567', '123.45', '1e0000', 'abcdef'])(
    'rejects malformed code %j before numeric conversion',
    (code) => {
      expect(validateAuthFields({ code }).code).toBeTruthy()
    },
  )

  it('accepts six digits and inclusive name limit', () => {
    expect(
      validateAuthFields({ code: '123456', firstName: 'x'.repeat(100) }),
    ).toEqual({})
    expect(
      validateAuthFields({ firstName: 'x'.repeat(101) }).firstName,
    ).toBeTruthy()
  })
})

describe('safe auth errors', () => {
  it.each([
    'Prisma error: database password=secret',
    '<script>alert(1)</script>',
    'token=secret user@example.com',
    '**zod error**',
  ])('never displays arbitrary error text: %s', (message) => {
    expect(
      getAuthErrorMessage(new ApiError(message, { status: 500 }), 'signup'),
    ).toBe('We’re having trouble right now. Please try again shortly.')
    expect(getAuthErrorMessage(new Error(message), 'login')).toBe(
      'Couldn’t log in right now. Please try again.',
    )
  })

  it('does not reveal which credential is incorrect or whether an email exists', () => {
    const missing = getAuthErrorMessage(
      new ApiError('User not found', { status: 404 }),
      'login',
    )
    expect(missing).toBe(
      getAuthErrorMessage(
        new ApiError('Invalid credentials', { status: 401 }),
        'login',
      ),
    )
    expect(
      getAuthErrorMessage(
        new ApiError('User not found', { status: 404 }),
        'request-reset',
      ),
    ).not.toContain('not found')
  })

  it('provides actionable code, connection and throttling errors', () => {
    expect(
      getAuthErrorMessage(
        new ApiError('Invalid OTP', { status: 401 }),
        'confirm',
      ),
    ).toContain('latest email')
    expect(
      getAuthErrorMessage(
        new ApiError('OTP has expired', { status: 400 }),
        'reset',
      ),
    ).toContain('Request a new one')
    expect(getAuthErrorMessage(new Error('Network Error'), 'login')).toContain(
      'internet',
    )
    expect(
      getAuthErrorMessage(new ApiError('raw', { status: 429 }), 'login'),
    ).toContain('Wait a little')
    expect(getAuthErrorMessage(new Error('timeout'), 'login')).toContain(
      'too long',
    )
    expect(getAuthErrorMessage(new Error('cancelled'), 'google')).toContain(
      'cancelled',
    )
  })
})
