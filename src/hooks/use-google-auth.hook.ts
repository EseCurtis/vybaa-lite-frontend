import { SocialLogin } from '@capgo/capacitor-social-login'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'

import ENV from '@/env'
import { authAPI } from '@/shared/api/auth.api'
import type {
  AuthResponse,
  GoogleAuthRequest,
  GoogleAuthStatus,
} from '@/shared/types/auth.types'

type UseGoogleAuthOptions = {
  onSuccess?: (response: AuthResponse) => void
}

type UseGoogleAuthResult = {
  error: string | null
  isLoading: boolean
  signInWithGoogle: () => Promise<void>
  status: GoogleAuthStatus
}

type GoogleLoginResponse = {
  accessToken?: { token?: string | null } | string | null
  jwt?: string | null
}

let isInitialized = false

async function ensureGoogleInitialized(): Promise<void> {
  if (isInitialized) {
    return
  }


  await SocialLogin.initialize({
    google: {
      iOSClientId: ENV.GOOGLE_IOS_CLIENT_ID,
      iOSServerClientId: ENV.GOOGLE_IOS_CLIENT_ID,
      webClientId: ENV.GOOGLE_CLIENT_ID,
      
    },
  })

  isInitialized = true
}

function getGoogleToken(result: GoogleLoginResponse | undefined): string | null {
  if (!result) {
    return null
  }

  if (result.jwt) {
    return result.jwt
  }

  if (typeof result.accessToken === 'string') {
    return result.accessToken
  }

  return result.accessToken?.token ?? null
}

export async function logoutGoogleNativeSession(): Promise<void> {
  try {
    await ensureGoogleInitialized()
    await SocialLogin.logout({ provider: 'google' })
  } catch {
    isInitialized = false
  }
}

export function useGoogleAuth(
  options?: UseGoogleAuthOptions,
): UseGoogleAuthResult {
  const [status, setStatus] = useState<GoogleAuthStatus>('idle')
  const mutation = useMutation<AuthResponse, Error, GoogleAuthRequest>({
    mutationFn: (payload: GoogleAuthRequest) => authAPI.googleAuth(payload),
    onSuccess: (response) => {
      const token = response.data.token
      const refreshToken = response.data.refreshToken

      localStorage.setItem('authToken', token)
      localStorage.setItem('refreshToken', refreshToken)
      options?.onSuccess?.(response)
    },
  })

  async function signInWithGoogle(): Promise<void> {
    try {
      setStatus('preparing')
      await ensureGoogleInitialized()

      setStatus('opening-google')
      const response = await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ['profile', 'email'],
         // forcePrompt: true,
        },
      })
      setStatus('verifying-google')
      const result = response.result as GoogleLoginResponse | undefined
      const token = getGoogleToken(result)

      if (!token) {
        throw new Error('Google login did not return a valid token')
      }

      setStatus('creating-session')
      await mutation.mutateAsync({ token })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to sign in with Google'
      throw new Error(message)
    } finally {
      setStatus('idle')
    }
  }

  const errorMessage =
    mutation.error instanceof Error ? mutation.error.message : mutation.error
      ? String(mutation.error)
      : null

  return {
    error: errorMessage,
    isLoading: status !== 'idle' || mutation.isPending,
    signInWithGoogle,
    status,
  }
}
