import TemplateDetailScreen from '@/app/(app)/communities/templates/$templateId.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/community/templates/$templateId')({
    component: () => (
      <ProtectedRoute requireAuth redirectTo="/">
        <TemplateDetailScreen />
      </ProtectedRoute>
    ),
})

