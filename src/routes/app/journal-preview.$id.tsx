import JournalPreviewScreen from '@/app/(app)/journal/journal-preview.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/journal-preview/$id')({
  component: () => {
    const { id } = Route.useParams()

    return (
      <ProtectedRoute requireAuth redirectTo="/">
        <JournalPreviewScreen journalId={id} />
      </ProtectedRoute>
    )
  },
})
