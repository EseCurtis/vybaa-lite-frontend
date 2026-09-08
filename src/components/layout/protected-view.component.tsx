import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { useAuth } from '@/providers/auth.provider'

type ProtectedViewComponentProps = {
  children: React.ReactNode
}

/**
 * Lightweight wrapper for protecting sections inside a screen.
 * Use `ProtectedRoute` for route-level protection.
 */
export const ProtectedViewComponent = ({
  children,
}: ProtectedViewComponentProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AppLoadingState message="Loading your space..." />
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
