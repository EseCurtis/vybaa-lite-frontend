import RewindSessionDetailScreen, {
  type RewindSessionDetailOrigin,
} from '@/app/(app)/rewind/rewind-session-detail.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

type RewindSessionDetailSearch = {
  from: RewindSessionDetailOrigin
}

function validateSearch(
  search: Record<string, unknown>,
): RewindSessionDetailSearch {
  const from = search.from
  return {
    from: from === 'history' || from === 'rewind' ? from : 'insights',
  }
}

function RewindSessionDetailRoute(): ReactElement {
  const { from } = Route.useSearch()

  return (
    <ProtectedRoute requireAuth redirectTo="/">
      <RewindSessionDetailScreen origin={from} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/r/$sessionId')({
  component: RewindSessionDetailRoute,
  validateSearch,
})
