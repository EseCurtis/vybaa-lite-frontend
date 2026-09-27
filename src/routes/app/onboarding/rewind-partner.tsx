import RewindPartnerOnboardingScreen from '@/app/(app)/rewind-partner-onboarding.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/onboarding/rewind-partner')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewindPartnerOnboardingScreen />
    </ProtectedRoute>
  ),
})
