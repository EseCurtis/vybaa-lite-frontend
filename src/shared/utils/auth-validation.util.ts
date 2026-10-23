import { ApiError } from '@/shared/api/http'

export type AuthField =
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'firstName'
  | 'lastName'
  | 'code'
export type AuthFields = Partial<Record<AuthField, string>>
export type AuthErrors = Partial<Record<AuthField, string>>
export type AuthAction =
  | 'login'
  | 'signup'
  | 'confirm'
  | 'resend'
  | 'request-reset'
  | 'reset'
  | 'google'
  | 'apple'

export function validateAuthFields(
  values: AuthFields,
  newPassword = false,
): AuthErrors {
  const errors: AuthErrors = {}
  if (values.email !== undefined) {
    const email = values.email.trim()
    if (!email) errors.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Enter a valid email, like you@example.com.'
  }
  for (const field of ['firstName', 'lastName'] as const) {
    const value = values[field]
    if (value === undefined) continue
    if (!value.trim())
      errors[field] =
        field === 'firstName'
          ? 'Enter your first name.'
          : 'Enter your last name.'
    else if (value.trim().length > 100)
      errors[field] = 'Keep your name to 100 characters or fewer.'
  }
  if (values.password !== undefined) {
    if (!values.password) errors.password = 'Enter your password.'
    else if (newPassword && values.password.length < 8)
      errors.password = 'Use at least 8 characters for your password.'
    else if (newPassword && values.password.length > 100)
      errors.password = 'Use 100 characters or fewer for your password.'
  }
  if (values.confirmPassword !== undefined) {
    if (!values.confirmPassword)
      errors.confirmPassword = 'Enter your password again.'
    else if (values.confirmPassword !== values.password)
      errors.confirmPassword = 'These passwords don’t match. Try again.'
  }
  if (values.code !== undefined && !/^[0-9]{6}$/.test(values.code.trim())) {
    errors.code = 'Enter the 6-digit code from your email.'
  }
  return errors
}

/** Never render arbitrary server, provider or transport messages in auth UI. */
export function getAuthErrorMessage(
  error: unknown,
  action: AuthAction,
): string {
  const status = error instanceof ApiError ? error.status : undefined
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (status === 429) return 'Too many attempts. Wait a little, then try again.'
  if (status !== undefined && status >= 500)
    return 'We’re having trouble right now. Please try again shortly.'
  if (/network|offline|failed to fetch/.test(message))
    return 'Couldn’t connect. Check your internet and try again.'
  if (/timeout|timed out/.test(message))
    return 'That took too long. Please try again.'
  if (
    (action === 'google' || action === 'apple') &&
    /cancel|closed|dismiss/.test(message)
  )
    return 'Sign-in was cancelled. Try again when you’re ready.'
  if ((action === 'confirm' || action === 'reset') && /expired/.test(message))
    return 'That code has expired. Request a new one and try again.'
  if (
    (action === 'confirm' || action === 'reset') &&
    (status === 400 || status === 401)
  )
    return 'That code didn’t work. Check the latest email or request a new code.'
  if (action === 'login' && (status === 401 || status === 404))
    return 'That email and password don’t match. Try again or reset your password.'
  if (action === 'signup' && /user already exists|email.*already/.test(message))
    return 'Couldn’t create an account with these details. Try logging in or resetting your password.'
  if (action === 'signup' && /username.*taken/.test(message))
    return 'That username isn’t available. Go back and choose another.'
  if (action === 'request-reset' || action === 'resend')
    return 'Couldn’t send a code. Check your email address and try again shortly.'
  if (action === 'google')
    return 'Couldn’t sign in with Google. Please try again or use email.'
  if (action === 'apple')
    return 'Couldn’t sign in with Apple. Please try again or use email.'
  if (action === 'signup')
    return 'Couldn’t create your account. Check your details and try again.'
  if (action === 'login') return 'Couldn’t log in right now. Please try again.'
  return 'Couldn’t finish that step. Please try again.'
}
