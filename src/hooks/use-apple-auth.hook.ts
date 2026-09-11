import { SocialLogin } from '@capgo/capacitor-social-login'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import ENV from '@/env'
import { authAPI } from '@/shared/api/auth.api'
import { CURRENT_TERMS_VERSION } from '@/shared/config/public-urls.config'
import type {
  AppleAuthRequest,
  AppleAuthStatus,
  AuthResponse,
} from '@/shared/types/auth.types'

type UseAppleAuthOptions = {
  onSuccess?: (response: AuthResponse) => void
}

type UseAppleAuthResult = {
  error: string | null
  isLoading: boolean
  signInWithApple: () => Promise<void>
  status: AppleAuthStatus
}

let isInitialized = false

async function ensureAppleInitialized(): Promise<void> {
  if (isInitialized) {
    return
  }

  await SocialLogin.initialize({
    apple: {
      clientId: ENV.APPLE_CLIENT_ID,
    },
  })

  isInitialized = true
}

export async function logoutAppleNativeSession(): Promise<void> {
  try {
    await ensureAppleInitialized()
    await SocialLogin.logout({ provider: 'apple' })
  } catch {
    isInitialized = false
  }
}

export function useAppleAuth(
  options?: UseAppleAuthOptions,
): UseAppleAuthResult {
  const [status, setStatus] = useState<AppleAuthStatus>('idle')
  const mutation = useMutation<AuthResponse, Error, AppleAuthRequest>({
    mutationFn: (payload: AppleAuthRequest) => authAPI.appleAuth(payload),
    onSuccess: (response) => {
      localStorage.setItem('authToken', response.data.token)
      localStorage.setItem('refreshToken', response.data.refreshToken)
      options?.onSuccess?.(response)
    },
  })

  async function signInWithApple(): Promise<void> {
    try {
      setStatus('preparing')
      await ensureAppleInitialized()

      setStatus('opening-apple')
      const response = await SocialLogin.login({
        provider: 'apple',
        options: {
          scopes: ['email', 'name'],
        },
      })
      setStatus('verifying-apple')
      const result = response.result
      const token = result.idToken?.trim()

      if (!token) {
        throw new Error('Apple login did not return a valid identity token')
      }

      setStatus('creating-session')
      await mutation.mutateAsync({
        acceptedTerms: true,
        familyName: result.profile.familyName || undefined,
        firstName: result.profile.givenName || undefined,
        termsVersion: CURRENT_TERMS_VERSION,
        token,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sign in with Apple'
      throw new Error(message)
    } finally {
      setStatus('idle')
    }
  }

  const errorMessage =
    mutation.error instanceof Error
      ? mutation.error.message
      : mutation.error
        ? String(mutation.error)
        : null

  return {
    error: errorMessage,
    isLoading: status !== 'idle' || mutation.isPending,
    signInWithApple,
    status,
  }
}
