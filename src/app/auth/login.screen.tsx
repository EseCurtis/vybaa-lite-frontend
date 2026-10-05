import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TermsConsent } from '@/components/common/terms-consent.component'
import { Button } from '@/components/layout/button.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { getApiErrorMessage } from '@/shared/utils/api-error.util'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

type LoginAction = 'email' | null

export default function LoginScreen() {
  const { loginWithEmail } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const formRef = useRef<HTMLFormElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<LoginAction>(null)

  const isEmailLoading = activeAction === 'email'
  const isSubmitting = activeAction !== null
  const loadingText = isEmailLoading
    ? 'Checking your email and password...'
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setActiveAction('email')

    try {
      await loginWithEmail({ email, password })
      toast.success('Welcome back')
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Login failed')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <AuthScreenLayout
      headerTitle="Log in"
      onBack={() => navigate({ to: '/' })}
      footer={
        <View className="mt-auto gap-3  mx-auto items-center">
          <TermsConsent action="login" />
          <Button
            type="submit"
            label={isEmailLoading ? 'Signing in...' : 'Log in'}
            fullWidth
            loading={isEmailLoading}
            disabled={isSubmitting}
            className="mt-2 !w-full"
            buttonClassName="w-full"
            onClick={() => formRef.current?.requestSubmit()}
          />

          <BottomNotch />
        </View>
      }
    >
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 w-full"
      >
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
        />
        <View className="flex flex-col">
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <TouchableOpacity
            onPress={() => navigate({ to: '/auth/forgot-password' })}
            className="mt-3"
          >
            <Text className="text-white font-bold text-xs">
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text className="text-danger-500 text-sm font-bbh">{error}</Text>
        )}
        {loadingText && (
          <Text className="text-card-lighter-2 text-xs font-bbh">
            {loadingText}
          </Text>
        )}

        <View className="gap-1 flex-row ml-auto !text-sm mt-7">
          <span className="opacity-70 text-card-lighter-3">New to vybaa?</span>
          <b onClick={() => navigate({ to: '/auth/signup' })}>
            Sign up for a new account.
          </b>
        </View>
      </form>
    </AuthScreenLayout>
  )
}
