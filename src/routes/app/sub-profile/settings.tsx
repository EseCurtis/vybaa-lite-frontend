import SettingsScreen from '@/app/(app)/settings.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example settings route for the starter app.
 *
 * This route requires authentication and is protected at the route level.
 */
export const Route = createFileRoute('/app/sub-profile/settings')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <SettingsScreen />
    </ProtectedRoute>
  ),
})
