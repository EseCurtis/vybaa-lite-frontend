import MyCommunitiesScreen from '@/app/(app)/communities/my-communities.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/communities/my')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <MyCommunitiesScreen />
    </ProtectedRoute>
  ),
})



