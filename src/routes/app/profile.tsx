import ProfileScreen from '@/app/(app)/profile.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example profile route for the starter app.
 *
 * This route requires authentication and is protected at the route level.
 */
export const Route = createFileRoute('/app/profile')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <ProfileScreen />
    </ProtectedRoute>
  ),
})
