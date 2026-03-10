import JoinByCodeScreen from '@/app/(app)/communities/invite.$code.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/invite/$code')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <JoinByCodeScreen />
    </ProtectedRoute>
  ),
})
