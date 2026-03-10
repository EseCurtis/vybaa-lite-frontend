import CommunityActivityScreen from '@/app/(app)/communities/$communityId.activity.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/community/activity/$communityId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunityActivityScreen />
    </ProtectedRoute>
  ),
})
