import InsightsScreen from '@/app/(app)/profile/insights.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/sub-profile/insights')({
  component: () => (
      <ProtectedRoute requireAuth redirectTo="/">
        <InsightsScreen />
      </ProtectedRoute>
    ),
})
