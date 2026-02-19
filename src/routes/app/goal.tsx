import GoalsAppScreen from '@/app/(goal)/index.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/goal')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <GoalsAppScreen />
    </ProtectedRoute>
  ),
})
