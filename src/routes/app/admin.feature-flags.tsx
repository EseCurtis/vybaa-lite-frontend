import AdminFeatureFlagsScreen from '@/app/(app)/admin-feature-flags.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/admin/feature-flags')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <AdminFeatureFlagsScreen />
    </ProtectedRoute>
  ),
})

