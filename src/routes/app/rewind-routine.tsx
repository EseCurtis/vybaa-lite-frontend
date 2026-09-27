import RewindRoutineScreen, {
  type RewindRoutineOrigin,
} from '@/app/(app)/rewind/rewind-routine.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

type RewindRoutineSearch = {
  from: RewindRoutineOrigin
}

function validateSearch(search: Record<string, unknown>): RewindRoutineSearch {
  return {
    from: search.from === 'settings' ? 'settings' : 'rewind',
  }
}

function RewindRoutineRoute(): ReactElement {
  const { from } = Route.useSearch()

  return (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewindRoutineScreen origin={from} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/rewind-routine')({
  component: RewindRoutineRoute,
  validateSearch,
})
