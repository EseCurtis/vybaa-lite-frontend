import RewardsScreen from '@/app/(app)/rewards.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/rewards')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewardsScreen />
    </ProtectedRoute>
  ),
})
