import { Input } from '@/components/common/input.component'
import { TopNotch } from '@/components/common/notch.component'
import { Button } from '@/components/layout/button.component'
import { KeyboardAvoidingView } from '@/components/layout/keyboard-avoiding-view.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { RiArrowLeftLine } from '@remixicon/react'
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
    <KeyboardAvoidingView
      behavior="padding"
      enableOnWeb
      keyboardVerticalOffset={24}
      className="flex-1 bg-black"
      style={{
        background: 'url(/assets/onboarding-bg.png)',
        backgroundSize: 'contain',
      }}
    >
      <TopNotch />
      <View className="max-w-md mx-auto flex-1 flex flex-col gap-6 px-4 py-6">
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-cardd flex items-center justify-center"
            onPress={() => navigate({ to: '/auth/login' })}
          >
            <RiArrowLeftLine className="text-white" size={18} />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold font-bbh">
            Confirm your account
          </Text>
        </View>

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
      </View>
    </KeyboardAvoidingView>
  )
}

