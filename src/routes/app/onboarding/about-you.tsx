import { createFileRoute } from '@tanstack/react-router'
import UserOnboardingScreen from '@/app/(app)/user-onboarding.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'

export const Route = createFileRoute('/app/onboarding/about-you')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <UserOnboardingScreen />
    </ProtectedRoute>
  ),
})
