import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { Text } from '@/components/layout/text.component'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'

export default function ConfirmAccountScreen() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/auth/confirm' }) as { email?: string }
  const toast = useToast()

  const [email, setEmail] = useState(search.email ?? '')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      await authAPI.confirmAccount({
        email,
        otp: Number(code),
      })
      setMessage('Account confirmed. You can log in now.')
      toast.success('Account confirmed')
      setTimeout(() => {
        navigate({ to: '/auth/login' })
      }, 800)
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Confirmation failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthScreenLayout
      headerTitle="Confirm your account"
      onBack={() => navigate({ to: '/auth/login' })}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <Input
          label="Confirmation code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="6‑digit code"
        />

        {error && (
          <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
        )}
        {message && (
          <Text className="text-green-400 text-sm font-bbh">{message}</Text>
        )}

        <Button
          type="submit"
          label="Confirm account"
          fullWidth
          loading={loading}
          disabled={loading}
          className="mt-4"
        />
      </form>
    </AuthScreenLayout>
  )
}
