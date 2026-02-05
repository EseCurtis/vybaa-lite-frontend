import { FlexxAppScreen } from '@/app/flexx.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/actions/flexx')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <FlexxAppScreen />
    </ProtectedRoute>
  ),
})
