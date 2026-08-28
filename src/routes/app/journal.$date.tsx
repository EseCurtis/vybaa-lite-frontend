import JournalEditorScreen from '@/app/(app)/journal/$date.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { featureFlags } from '@/shared/config/feature-flags.config'

export const Route = createFileRoute('/app/journal/$date')({
  beforeLoad: () => {
    if (!featureFlags.journal) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: () => {
    const { date } = Route.useParams()

    return (
      <ProtectedRoute requireAuth redirectTo="/">
        <JournalEditorScreen date={date} />
      </ProtectedRoute>
    )
  },
})
