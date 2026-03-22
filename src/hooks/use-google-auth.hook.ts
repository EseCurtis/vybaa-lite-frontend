import ENV from '@/env'
import { authAPI } from '@/shared/api/auth.api'
import type { AuthResponse, GoogleAuthRequest } from '@/shared/types/auth.types'
import { SocialLogin } from '@capgo/capacitor-social-login'
import { useMutation } from '@tanstack/react-query'

type UseGoogleAuthOptions = {
  /**
   * Invoked after a successful Google auth response from the backend.
   * This is where callers typically sync global auth state.
   */
  onSuccess?: (response: AuthResponse) => void
}

type UseGoogleAuthResult = {
  /**
   * Triggers the Capacitor Google login flow and then calls the backend.
   */
  signInWithGoogle: () => Promise<void>
  isLoading: boolean
  error: string | null
}

interface GoogleLoginResponse {
  jwt?: string | null
  accessToken?: string | null
}

let isInitialized = false

async function ensureGoogleInitialized() {
  if (isInitialized) return

  // We initialise the social-login plugin lazily the first time Google login is used.
  // For more advanced setups (multiple providers, custom scopes, etc.) you can
  // move this into a dedicated Capacitor plugin module.
  await SocialLogin.initialize({
    google: {
      webClientId: ENV.GOOGLE_CLIENT_ID,
      iOSClientId: ENV.GOOGLE_IOS_CLIENT_ID,
      iOSServerClientId: ENV.GOOGLE_IOS_CLIENT_ID,
    }
  })

  isInitialized = true

  return isInitialized
}

/**
 * Hook that wraps the Capacitor Social Login Google flow
 * and your `/api/v1/auth/google` backend endpoint.
 *
 * It:
 * - opens the native Google login UI via `capacitor-social-login`
 * - extracts the ID token / access token from the plugin response
 * - sends it to the backend
 * - stores access/refresh tokens in localStorage
 */
export function useGoogleAuth(options?: UseGoogleAuthOptions): UseGoogleAuthResult {
  const mutation = useMutation<AuthResponse, Error, GoogleAuthRequest>({
    mutationFn: (payload: GoogleAuthRequest) => authAPI.googleAuth(payload),
    onSuccess: (response) => {
      const token = response?.data?.token
      const refreshToken = response?.data?.refreshToken

      // Persist tokens for HTTP interceptors and future sessions
      if (token) {
        localStorage.setItem('authToken', token)
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }

      if (options?.onSuccess) {
        options.onSuccess(response)
      }
    },
  })

  const signInWithGoogle = async (): Promise<void> => {
    try {
      await ensureGoogleInitialized()
      await SocialLogin.logout({
        provider: "google"
      })

      const response = (await SocialLogin.login({
        provider: 'google',
        options: {
          scopes: ["profile", "email"],
          forceRefreshToken: true,
          autoSelectEnabled: false,
          filterByAuthorizedAccounts: false
        },
      }))

      const result = response?.result as GoogleLoginResponse;

      const token = result?.jwt ?? (result?.accessToken as any)?.token




      if (!token) {
        throw new Error('Google login did not return a valid tokennn' + JSON.stringify(token))
      }



      await mutation.mutateAsync({ token })
    } catch (err) {
     // alert(JSON.stringify(err))
      // Re-throw the error so it can be caught by the caller
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      throw new Error(errorMessage)
    }
  }

  const errorMessage =
    mutation.error instanceof Error ? mutation.error.message : mutation.error
      ? String(mutation.error)
      : null

  return {
    signInWithGoogle,
    isLoading: mutation.isPending,
    error: errorMessage,
  }
}


