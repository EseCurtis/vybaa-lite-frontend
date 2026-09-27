import { Home2Screen } from '@/app/(app)/home-2.screen'
import { AppLoadingState } from '@/components/common/app-loading-state.component'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { useAuth } from '@/providers/auth.provider'
import { getRequiredOnboardingRoute } from '@/shared/utils/auth-redirect.util'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

function HomeRouteScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    void getRequiredOnboardingRoute(user)
      .then(async (onboardingRoute) => {
        if (cancelled) return
        if (onboardingRoute) {
          await router.navigate({ replace: true, to: onboardingRoute })
          return
        }
        setResolvedUserId(user.id)
      })
      .catch(() => {
        // Native permission checks must never prevent access to Home.
        if (!cancelled) setResolvedUserId(user.id)
      })

    return () => {
      cancelled = true
    }
  }, [router, user])

  if (!user || resolvedUserId !== user.id) {
    return <AppLoadingState message="Getting your home ready..." />
  }

  return <Home2Screen />
}

/**
 * Example \"home\" route for the starter app.
 *
 * This route is now protected and requires an authenticated session.
 */
export const Route = createFileRoute('/app/home')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      {/* <HomeAppScreen/> */}
      <HomeRouteScreen />
    </ProtectedRoute>
  ),
})
