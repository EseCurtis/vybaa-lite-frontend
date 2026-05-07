import PublicProfileScreen from '@/app/(app)/profile/public-profile.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/u/$username')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <PublicProfileScreen />
    </ProtectedRoute>
  ),
})
