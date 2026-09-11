import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { useAuth } from '@/providers/auth.provider'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

type ProtectedRouteProps = {
  children: React.ReactNode
  /**
   * When true (default), the user must be authenticated to view this route.
   * When false, the route is only for unauthenticated users.
   */
  requireAuth?: boolean
  /**
   * Destination when access is denied.
   * - If requireAuth === true → where unauthenticated users are sent.
   * - If requireAuth === false → where authenticated users are sent.
   */
  redirectTo: string
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  redirectTo,
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    // If auth is required but user is not authenticated, send them away.
    if (requireAuth && !isAuthenticated) {
      navigate({ to: redirectTo, replace: true })
      return
    }

    // If auth is NOT required but user is already authenticated,
    // keep them inside the app experience instead of auth screens.
    if (!requireAuth && isAuthenticated && user) {
      void navigateAfterAuth(router, user)
    }
  }, [
    isAuthenticated,
    isLoading,
    navigate,
    redirectTo,
    requireAuth,
    router,
    user,
  ])

  if (isLoading) {
    return (
      <AppLoadingState
        detail="Your account and latest activity are being restored."
        message="Checking your session..."
      />
    )
  }

  if (requireAuth && !isAuthenticated) {
    return <AppLoadingState message="Opening sign in..." />
  }

  if (!requireAuth && isAuthenticated) {
    return <AppLoadingState message="Opening Vybaa..." />
  }

  return <>{children}</>
}
