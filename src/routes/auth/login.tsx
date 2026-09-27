import LoginScreen from '@/app/auth/login.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: () => (
    <ProtectedRoute requireAuth={false} redirectTo="/app/home">
      <LoginScreen />
    </ProtectedRoute>
  ),
})
