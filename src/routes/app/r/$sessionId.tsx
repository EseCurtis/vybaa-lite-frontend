import RewindSessionDetailScreen from '@/app/(app)/rewind/rewind-session-detail.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/r/$sessionId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewindSessionDetailScreen />
    </ProtectedRoute>
  ),
})
