import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/app/goal')({
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <Outlet />
    </ProtectedRoute>
  ),
})
