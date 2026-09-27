import ConfirmAccountScreen from '@/app/auth/confirm-account.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/confirm')({
  component: () => (
    <ProtectedRoute requireAuth={false} redirectTo="/app/home">
      <ConfirmAccountScreen />
    </ProtectedRoute>
  ),
})
