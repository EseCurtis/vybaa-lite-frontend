import RewindScreen from '@/app/(app)/rewind.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/rewind')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewindScreen />
    </ProtectedRoute>
  ),
})

