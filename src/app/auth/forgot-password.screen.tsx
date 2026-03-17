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
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export default function ForgotPasswordScreen() {
  const navigate = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<'request' | 'reset'>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
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
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      await authAPI.resetPassword({
        email,
        otp: Number(otp),
        newPassword: password,
      })
      setMessage('Password reset. You can log in with your new password.')
      toast.success('Password reset')
      navigate({ to: "/auth/login"})
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Failed to reset password'
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
      className="flex-1 bg-black pt-32"
      style={{
        background: 'url(/assets/onboarding-bg.png)',
        backgroundSize: 'contain',
      }}
    >
      <View className="absolute top-0 left-0 w-full  z-10 px-05-mg ">
        <TopNotch />
        <View className="flex-row items-center gap-3 mb-2">
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-cardd flex items-center justify-center"
            onPress={() => {
              navigate({ to: '/' })
            }}
          >
            <RiArrowLeftLine className="text-white" size={18} />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold font-bbh">
            {' '}
            Reset Password
          </Text>
        </View>
      </View>

      <View className="max-w-md mx-auto flex-1 flex flex-col gap-6 px-4 py-6">
        {step === 'request' ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-4 w-full">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {error && (
              <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
            )}
            {message && (
              <Text className="text-green-400 text-sm font-bbh">{message}</Text>
            )}
            <Button
              type="submit"
              label="Send reset code"
              fullWidth
              loading={loading}
              disabled={loading}
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
              placeholder="6‑digit code"
            />
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            {error && (
              <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
            )}
            {message && (
              <Text className="text-green-400 text-sm font-bbh">{message}</Text>
            )}
            <Button
              type="submit"
              label="Reset password"
              fullWidth
              loading={loading}
              disabled={loading}
              className="mt-4"
            />
          </form>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
