import PermissionOnboardingScreen from '@/app/(app)/permission-onboarding.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/permissions')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <PermissionOnboardingScreen />
    </ProtectedRoute>
  ),
})
