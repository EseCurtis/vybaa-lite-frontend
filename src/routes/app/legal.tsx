import { LegalScreen } from '@/app/(app)/legal.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import type { LegalDocumentType } from '@/shared/config/public-urls.config'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/legal')({
  component: () => {
    const search = Route.useSearch() as { document?: LegalDocumentType }
    const documentType = search.document === 'privacy' ? 'privacy' : 'terms'

    return (
      <ProtectedRoute requireAuth redirectTo="/">
        <LegalScreen documentType={documentType} />
      </ProtectedRoute>
    )
  },
})
