import JournalListScreen from '@/app/(app)/journal/index.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { featureFlags } from '@/shared/config/feature-flags.config'

export const Route = createFileRoute('/app/journal/')({
  beforeLoad: () => {
    if (!featureFlags.journal) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <JournalListScreen />
    </ProtectedRoute>
  ),
})
