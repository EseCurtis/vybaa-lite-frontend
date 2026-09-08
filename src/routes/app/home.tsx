import { Home2Screen } from '@/app/(app)/home-2.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { shouldShowPermissionOnboarding } from '@/shared/permissions/permission-onboarding.util'
import { createFileRoute, Navigate } from '@tanstack/react-router'

function HomeRouteScreen() {
  if (shouldShowPermissionOnboarding()) {
    return <Navigate replace to="/app/permissions" />
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
