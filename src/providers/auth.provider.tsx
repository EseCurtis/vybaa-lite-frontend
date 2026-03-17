import { useGoogleAuth } from '@/hooks/use-google-auth.hook'
import { authAPI } from '@/shared/api/auth.api'
import { resetTimezoneTracking } from '@/shared/api/http'
import type {
  AuthContextValue,
  AuthResponse,
  AuthState,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  RegisterConfirmationResponse,
  SessionResponse,
} from '@/shared/types/auth.types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const AuthContext = createContext<AuthContextValue | null>(null)

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  stale: true,
}

const SESSION_QUERY_KEY = ['auth', 'session'] as const

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>(initialState)
  const queryClient = useQueryClient()

  const hasTokens =
    typeof window !== 'undefined' &&
    !!localStorage.getItem('authToken') &&
    !!localStorage.getItem('refreshToken')

  const sessionQuery = useQuery<SessionResponse, Error>({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => authAPI.getSession(),
    enabled: hasTokens,
    retry: 1,
  })

  useEffect(() => {
    if (sessionQuery.isLoading) {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }))
      return
    }

    if (sessionQuery.isError) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: sessionQuery.error.message,
        stale: false,
      })
      return
    }

    if (sessionQuery.data) {
      const user: AuthUser = sessionQuery.data.data.user
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        stale: false,
      })
    } else {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        stale: false,
      })
    }
  }, [
    sessionQuery.data,
    sessionQuery.error,
    sessionQuery.isError,
    sessionQuery.isLoading,
  ])

  const handleAuthSuccess = useCallback(async () => {
    // After tokens are stored, fetch the session immediately
    // This ensures the auth state is updated right away
    try {
      await queryClient.fetchQuery({
        queryKey: SESSION_QUERY_KEY,
        queryFn: async () => authAPI.getSession(),
      })
    } catch (error) {
      // If session fetch fails, invalidate to trigger error state
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
    }
  }, [queryClient])

  const google = useGoogleAuth({
    onSuccess: () => {
      void handleAuthSuccess()
    },
  })

  const persistTokens = useCallback((data: AuthResponse['data']) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('authToken', data.token)
    localStorage.setItem('refreshToken', data.refreshToken)
  }, [])

  const loginWithEmail = useCallback(
    async (credentials: LoginRequest) => {
      const res = await authAPI.login(credentials)
      persistTokens(res.data)
      await handleAuthSuccess()
    },
    [handleAuthSuccess, persistTokens],
  )

  const registerWithEmail = useCallback(
    async (
      payload: RegisterRequest,
    ): Promise<AuthResponse | RegisterConfirmationResponse> => {
      const res = await authAPI.register(payload)

      // If the backend ever returns tokens on register, auto-login.
      if ('data' in res && (res as AuthResponse).data?.token) {
        const authRes = res as AuthResponse
        persistTokens(authRes.data)
        await handleAuthSuccess()
        return authRes
      }

      return res as RegisterConfirmationResponse
    },
    [handleAuthSuccess, persistTokens],
  )

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      // Best-effort logout: if push token management is added later we can
      // wire it in here. For now we simply notify the backend and clear state.
      await authAPI.logout({ fcmToken: '' })
    },
    onSettled: () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('refreshToken')
      resetTimezoneTracking()
      queryClient.removeQueries({ queryKey: SESSION_QUERY_KEY })
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        stale: false,
      })
    },
  })

  const loginWithGoogle = useCallback(async () => {
    await google.signInWithGoogle()
  }, [google])

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const refreshSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY })
  }, [queryClient])

  const value: AuthContextValue = useMemo(
    () => ({
      ...state,
      error:
        state.error ?? google.error ?? logoutMutation.error?.message ?? null,
      isLoading:
        state.isLoading || google.isLoading || logoutMutation.isPending,
      loginWithGoogle,
      loginWithEmail,
      registerWithEmail,
      logout,
      refreshSession,
    }),
    [
      google.error,
      google.isLoading,
      loginWithGoogle,
      logout,
      logoutMutation.error?.message,
      logoutMutation.isPending,
      refreshSession,
      state,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('AuthProvider is missing in the component tree')
  }
  return ctx
}
