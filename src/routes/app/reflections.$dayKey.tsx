import { createFileRoute } from '@tanstack/react-router'

import DailyReflectionScreen from '@/app/(app)/rewind/daily-reflection.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'

function DailyReflectionRoute() {
  const { dayKey } = Route.useParams()
  return (
    <ProtectedRoute requireAuth redirectTo="/">
      <DailyReflectionScreen dayKey={dayKey} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/reflections/$dayKey')({
  component: DailyReflectionRoute,
})
