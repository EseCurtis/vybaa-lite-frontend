import { createFileRoute } from '@tanstack/react-router'

import RewindObservationsScreen from '@/app/(app)/rewind/rewind-observations.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'

export const Route = createFileRoute('/app/rewind-observations')({
  component: () => (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindObservationsScreen />
    </ProtectedRoute>
  ),
})
