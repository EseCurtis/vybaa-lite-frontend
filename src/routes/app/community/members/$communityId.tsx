import CommunityMembersScreen from '@/app/(app)/communities/$communityId.members.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/community/members/$communityId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunityMembersScreen />
    </ProtectedRoute>
  ),
})
