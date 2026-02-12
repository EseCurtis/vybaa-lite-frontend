import { FlexxV2AppScreen } from '@/app/flexx.v2.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/actions/flexx')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <FlexxV2AppScreen />
    </ProtectedRoute>
  ),
})
