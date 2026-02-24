import TemplateDetailScreen from '@/app/(app)/communities/templates/$templateId.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/communities/templates/$templateId')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <TemplateDetailScreen />
    </ProtectedRoute>
  ),
})
