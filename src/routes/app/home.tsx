import { Home2Screen } from '@/app/(app)/home-2.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example \"home\" route for the starter app.
 *
 * This route is now protected and requires an authenticated session.
 */
export const Route = createFileRoute('/app/home')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">

      {/* <HomeAppScreen/> */}
      <Home2Screen />
    </ProtectedRoute>
  ),
})
