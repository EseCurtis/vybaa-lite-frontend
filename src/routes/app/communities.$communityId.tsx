import CommunityDetailScreen from '@/app/(app)/communities/$communityId.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/communities/$communityId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunityDetailScreen />
    </ProtectedRoute>
  ),
})

