import SignupScreen from '@/app/auth/signup.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/signup')({
  component: () => (
    <ProtectedRoute requireAuth={false} redirectTo="/app/home">
      <SignupScreen />
    </ProtectedRoute>
  ),
})
