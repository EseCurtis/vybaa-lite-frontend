import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

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

  const loadingText =
    activeAction === 'sending-code'
      ? 'Sending a reset code to your email...'
      : activeAction === 'resetting-password'
        ? 'Updating your password...'
        : null
  const isLoading = activeAction !== null

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setActiveAction('sending-code')
    try {
      await authAPI.requestPasswordReset({ email })
      setMessage('We sent a reset code to your email.')
      toast.success('Reset code sent')
      setStep('reset')
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Failed to send reset code'
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setActiveAction('resetting-password')
    try {
      await authAPI.resetPassword({
        email,
        otp: Number(otp),
        newPassword: password,
      })
      setMessage('Password reset. You can log in with your new password.')
      toast.success('Password reset')
      navigate({ to: '/auth/login' })
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Failed to reset password'
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
        <form onSubmit={handleRequest} className="flex flex-col gap-4 w-full">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            placeholder="you@example.com"
          />
          {error && (
            <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
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
        <form onSubmit={handleReset} className="flex flex-col gap-4 w-full">
          <Input
            label="Email"
            type="email"
            value={email}
            disabled
            placeholder={email}
          />
          <Input
            label="Reset code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={isLoading}
            placeholder="6‑digit code"
          />
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="••••••••"
          />
          {error && (
            <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
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
