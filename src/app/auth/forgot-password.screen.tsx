import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { useAuthValidation } from '@/hooks/use-auth-validation.hook'
import { getAuthErrorMessage } from '@/shared/utils/auth-validation.util'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

type ForgotPasswordAction = 'resetting-password' | 'sending-code' | null

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ForgotPasswordAction>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const validation = useAuthValidation(
    step === 'request' ? { email } : { email, code: otp, password },
    true,
  )

  const loadingText =
    activeAction === 'sending-code'
      ? 'Sending a reset code to your email...'
      : activeAction === 'resetting-password'
        ? 'Updating your password...'
        : null
  const isLoading = activeAction !== null

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError(null)
    setMessage(null)
    if (!validation.validate(formRef.current)) return
    setActiveAction('sending-code')
    try {
      await authAPI.requestPasswordReset({ email: email.trim() })
      setMessage('We sent a reset code to your email.')
      toast.success('Reset code sent')
      setStep('reset')
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'request-reset')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    setError(null)
    setMessage(null)
    if (!validation.validate(formRef.current)) return
    setActiveAction('resetting-password')
    try {
      await authAPI.resetPassword({
        email: email.trim(),
        otp: Number(otp.trim()),
        newPassword: password,
      })
      setMessage('Password reset. You can log in with your new password.')
      toast.success('Password reset')
      navigate({ to: '/auth/login' })
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'reset')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <AuthScreenLayout
      headerTitle="Reset Password"
      onBack={() => {
        navigate({ to: '/' })
      }}
    >
      {step === 'request' ? (
        <form
          ref={formRef}
          noValidate
          onSubmit={handleRequest}
          className="flex flex-col gap-4 w-full"
        >
          <Input
            label="Email"
            name="email"
            autoComplete="email"
            autoCapitalize="none"
            inputMode="email"
            {...validation.field('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="you@example.com"
          />
          {error && (
            <Text role="alert" className="text-danger-500 text-sm font-bbh">
              {error}
            </Text>
          )}
          {message && (
            <Text className="text-green-400 text-sm font-bbh">{message}</Text>
          )}
          {loadingText && (
            <Text className="text-card-lighter-2 text-xs font-bbh">
              {loadingText}
            </Text>
          )}
          <Button
            type="submit"
            label={isLoading ? 'Sending code...' : 'Send reset code'}
            fullWidth
            loading={activeAction === 'sending-code'}
            disabled={isLoading}
            className="mt-4"
          />
        </form>
      ) : (
        <form
          ref={formRef}
          noValidate
          onSubmit={handleReset}
          className="flex flex-col gap-4 w-full"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            disabled
            placeholder={email}
          />
          <Input
            label="Reset code"
            name="code"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            {...validation.field('code')}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isLoading}
            placeholder="6‑digit code"
          />
          <Input
            label="New password"
            name="password"
            autoComplete="new-password"
            helperText="Use 8–100 characters."
            {...validation.field('password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
          />
          {error && (
            <Text role="alert" className="text-danger-500 text-sm font-bbh">
              {error}
            </Text>
          )}
          {message && (
            <Text className="text-green-400 text-sm font-bbh">{message}</Text>
          )}
          {loadingText && (
            <Text className="text-card-lighter-2 text-xs font-bbh">
              {loadingText}
            </Text>
          )}
          <Button
            type="submit"
            label={isLoading ? 'Resetting password...' : 'Reset password'}
            fullWidth
            loading={activeAction === 'resetting-password'}
            disabled={isLoading}
            className="mt-4"
          />
        </form>
      )}
    </AuthScreenLayout>
  )
}
