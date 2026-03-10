import CommunityGoalsScreen from '@/app/(app)/communities/$communityId.goals.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/community/goals/$communityId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunityGoalsScreen />
    </ProtectedRoute>
  ),
})
