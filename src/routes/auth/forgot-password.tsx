import ForgotPasswordScreen from '@/app/auth/forgot-password.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/forgot-password')({
  component: () => (
    <ProtectedRoute requireAuth={false} redirectTo="/app/home">
      <ForgotPasswordScreen />
    </ProtectedRoute>
  ),
})
