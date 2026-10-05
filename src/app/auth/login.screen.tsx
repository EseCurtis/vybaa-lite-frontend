import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { Input } from '@/components/common/input.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TermsConsent } from '@/components/common/terms-consent.component'
import { Button } from '@/components/layout/button.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import ENV from '@/env'
import { getGoogleAuthStatusText } from '@/shared/utils/auth-status.util'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { ApiError } from '@/shared/api/http'
import { isGoogleLoginAvailable } from '@/shared/utils/auth-platform.util'
import { getApiErrorMessage } from '@/shared/utils/api-error.util'
import { RiGoogleFill, RiLoader4Line } from '@remixicon/react'
import { useNavigate } from '@tanstack/react-router'
import { useRef, useState } from 'react'

type LoginAction = 'email' | 'google' | null

export default function LoginScreen() {
  const { googleAuthStatus, loginWithEmail, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const formRef = useRef<HTMLFormElement>(null)
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
    } catch (error: unknown) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_CONFIRMED') {
        setError(null)
        navigate({
          to: '/auth/confirm',
          search: { email: email.trim() },
        })
        return
      }

      const msg = getApiErrorMessage(error, 'Login failed')
      setError(msg)
      toast.error(msg)
    } finally {
      setActiveAction(null)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    setActiveAction('google')
    try {
      await loginWithGoogle()
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error, 'Failed to sign in with Google')
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

          {canUseGoogleLogin && (
            <>
              <View className="flex-row items-center gap-3 mt-3 w-full">
                <View className="flex-1 h-px bg-card-lighter" />
                <Text className="text-card-lighter text-[10px] font-bbh uppercase tracking-[0.2em]">
                  or
                </Text>
                <View className="flex-1 h-px bg-card-lighter" />
              </View>
              <TouchableOpacity
                className="w-full min-h-[52px] mt-1 rounded-full bg-cardd flex-row items-center justify-center gap-3 px-4"
                disabled={isSubmitting}
                onPress={handleGoogle}
                accessibilityLabel="Continue with Google"
              >
                {isGoogleLoading ? (
                  <RiLoader4Line
                    className="text-white animate-spin"
                    size={18}
                  />
                ) : (
                  <RiGoogleFill className="text-white" size={18} />
                )}
                <Text className="text-white text-sm font-bbh font-bold">
                  {isGoogleLoading
                    ? 'Opening Google...'
                    : 'Continue with Google'}
                </Text>
              </TouchableOpacity>
            </>
          )}

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
        {loadingText && !isGoogleLoading && (
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
      {isGoogleLoading && loadingText ? (
        <AppLoadingState
          detail="Finish choosing your account in the Google window."
          message={loadingText}
          mode="dock"
        />
      ) : null}
    </AuthScreenLayout>
  )
}
