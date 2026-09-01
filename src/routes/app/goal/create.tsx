import CreateGoalScreen from '@/app/(goal)/create.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/goal/create')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CreateGoalScreen />
    </ProtectedRoute>
  ),
})
