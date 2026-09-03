import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
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
  const { isAuthenticated, isLoading } = useAuth()
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
    if (!requireAuth && isAuthenticated) {
      void navigateAfterAuth(router)
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo, requireAuth, router])

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-accent-600 text-lg font-bbh">VYBAA</Text>
      </View>
    )
  }

  // While the redirect effect runs we still render null to avoid flashes.
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
