import CommunitiesDiscoverScreen from '@/app/(app)/communities/index.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/communities')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunitiesDiscoverScreen />
    </ProtectedRoute>
  ),
})

