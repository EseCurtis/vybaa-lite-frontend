import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { useAuthValidation } from '@/hooks/use-auth-validation.hook'
import { getAuthErrorMessage } from '@/shared/utils/auth-validation.util'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useRef, useState } from 'react'

type ConfirmAccountAction = 'confirming-account' | 'resending-code' | null

export default function ConfirmAccountScreen() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/confirm' }) as { email?: string }
  const toast = useToast()

  const [email, setEmail] = useState(search.email ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<ConfirmAccountAction>(null)
  const isConfirming = activeAction === 'confirming-account'
  const isResending = activeAction === 'resending-code'
  const isBusy = activeAction !== null
  const formRef = useRef<HTMLFormElement>(null)
  const validation = useAuthValidation({ email, code })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isBusy) return
    setError(null)
    setMessage(null)
    if (!validation.validate(formRef.current)) return
    setActiveAction('confirming-account')

    try {
      await authAPI.confirmAccount({
        email: email.trim(),
        otp: Number(code.trim()),
      })
      setMessage('Account confirmed. You can log in now.')
      toast.success('Account confirmed')
      setTimeout(() => {
        navigate({ to: '/auth/login' })
      }, 800)
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'confirm')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  const handleResend = async () => {
    if (isBusy) return
    const normalizedEmail = email.trim()
    setError(null)
    setMessage(null)

    if (!validation.validate(formRef.current, { email })) return

    setActiveAction('resending-code')
    try {
      await authAPI.requestConfirmation(normalizedEmail)
      setMessage('A new confirmation code is on its way.')
      toast.success('New confirmation code sent')
    } catch (err: unknown) {
      const msg = getAuthErrorMessage(err, 'resend')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <AuthScreenLayout
      headerTitle="Confirm your account"
      onBack={() => navigate({ to: '/auth/login' })}
    >
      <form
        ref={formRef}
        noValidate
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full"
      >
        <Text className="text-card-lighter-2 text-sm font-bbh leading-5">
          Confirm your email before you can log in. If the code expired, request
          a fresh one below.
        </Text>
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
          disabled={isBusy}
          placeholder="you@example.com"
        />
        <Input
          label="Confirmation code"
          name="code"
          autoComplete="one-time-code"
          inputMode="numeric"
          maxLength={6}
          {...validation.field('code')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={isBusy}
          placeholder="6‑digit code"
        />

        {error && (
          <Text role="alert" className="text-danger-500 text-sm font-bbh">
            {error}
          </Text>
        )}
        {message && (
          <Text className="text-green-400 text-sm font-bbh">{message}</Text>
        )}
        {isConfirming && (
          <Text className="text-card-lighter-2 text-xs font-bbh">
            Checking your confirmation code...
          </Text>
        )}

        <Button
          type="submit"
          label={isConfirming ? 'Confirming...' : 'Confirm account'}
          fullWidth
          loading={isConfirming}
          disabled={isBusy}
          className="mt-4"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          label={isResending ? 'Sending new code...' : 'Request a new code'}
          fullWidth
          loading={isResending}
          disabled={isBusy}
          onClick={handleResend}
        />
      </form>
    </AuthScreenLayout>
  )
}
