import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { Button } from '@/components/layout/button.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import ENV from '@/env'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import { isGoogleLoginAvailable } from '@/shared/utils/auth-platform.util'
import { getGoogleAuthStatusText } from '@/shared/utils/auth-status.util'
import { RiGoogleFill, RiLoader4Line } from '@remixicon/react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

type LoginAction = 'email' | 'google' | null

export default function LoginScreen() {
  const { googleAuthStatus, loginWithEmail, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<LoginAction>(null)
  const canUseGoogleLogin = isGoogleLoginAvailable(ENV.PLATFORM)

  const isEmailLoading = activeAction === 'email'
  const isGoogleLoading = activeAction === 'google'
  const isSubmitting = activeAction !== null
  const loadingText =
    activeAction === 'email'
      ? 'Checking your email and password...'
      : activeAction === 'google'
        ? (getGoogleAuthStatusText(googleAuthStatus) ??
          'Signing in with Google...')
        : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setActiveAction('email')

    try {
      await loginWithEmail({ email, password })
      toast.success('Welcome back')
      await navigateAfterAuth(router)
    } catch (err: any) {
      const msg = err?.msg || err?.message || 'Login failed'
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  const handleGoogle = async () => {
    setActiveAction('google')
    try {
      await loginWithGoogle()
      await navigateAfterAuth(router)
    } catch (err: any) {
      const msg =
        err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  return (
    <AuthScreenLayout headerTitle="Log in" onBack={() => navigate({ to: '/' })}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          placeholder="you@example.com"
          // className="rounded-lg"
        />
        <View className="flex flex-col">
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            placeholder="••••••••"
            // className="rounded-lg py-0 "
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

        <Button
          type="submit"
          label={isEmailLoading ? 'Signing in...' : 'Log in'}
          fullWidth
          loading={isEmailLoading}
          disabled={isSubmitting}
          className="mt-4"
        />
      </form>

      {canUseGoogleLogin && (
        <>
          <View className="flex-row items-center gap-3 mt-4">
            <View className="flex-1 flex items-center justify-center">
              <View className="w-full h-[1px] bg-card-lighter/50" />
            </View>
            <Text className="text-card-lighter text-[10px] font-bbh uppercase tracking-[0.2em]">
              or continue with
            </Text>
            <View className="flex-1 flex items-center justify-center">
              <View className="w-full h-[1px] bg-card-lighter/50" />
            </View>
          </View>

          <TouchableOpacity
            className="w-full py-4 mt-2 rounded-full bg-cardd flex items-center justify-between px-4"
            disabled={isSubmitting}
            onPress={handleGoogle}
          >
            {isGoogleLoading ? (
              <RiLoader4Line className="text-white animate-spin" size={18} />
            ) : (
              <RiGoogleFill className="text-white" size={18} />
            )}
            <View className="flex-row items-center gap-2 mx-auto">
              <Text className="text-white text-sm font-bbh font-bold">
                {isGoogleLoading ? 'Opening Google...' : 'Continue with Google'}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}

      <View className="mt-auto">
        <Button
          variant="ghost"
          fullWidth
          label="Need an account? Sign up"
          disabled={isSubmitting}
          onClick={() => navigate({ to: '/auth/signup' })}
        />
      </View>
    </AuthScreenLayout>
  )
}
