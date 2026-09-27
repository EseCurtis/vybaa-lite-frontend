import { AuthScreenLayout } from '@/components/common/auth-screen-layout.component'
import { Input } from '@/components/common/input.component'
import { TermsConsent } from '@/components/common/terms-consent.component'
import { Button } from '@/components/layout/button.component'
import { TouchableOpacity } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { getApiErrorMessage } from '@/shared/utils/api-error.util'
import { CURRENT_TERMS_VERSION } from '@/shared/config/public-urls.config'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

type LoginAction = 'email' | null

export default function LoginScreen() {
  const { loginWithEmail } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [activeAction, setActiveAction] = useState<LoginAction>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  const isEmailLoading = activeAction === 'email'
  const isSubmitting = activeAction !== null
  const loadingText = isEmailLoading
    ? 'Checking your email and password...'
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!acceptedTerms) {
      const message = 'Accept the Terms of Use to log in.'
      setError(message)
      toast.error(message)
      return
    }
    setActiveAction('email')

    try {
      await loginWithEmail({
        acceptedTerms: true,
        email,
        password,
        termsVersion: CURRENT_TERMS_VERSION,
      })
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

        <TermsConsent
          accepted={acceptedTerms}
          disabled={isSubmitting}
          onChange={setAcceptedTerms}
        />

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
          disabled={isSubmitting || !acceptedTerms}
          className="mt-4"
        />
      </form>

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
