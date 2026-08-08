import GoalsAppScreen from '@/app/(goal)/index.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

type GoalRouteSearch = {
  goalId?: string
}

function validateSearch(search: Record<string, unknown>): GoalRouteSearch {
  const goalId = typeof search.goalId === 'string' ? search.goalId.trim() : ''
  return goalId && goalId.length <= 128 && /^[a-z0-9_-]+$/i.test(goalId)
    ? { goalId }
    : {}
}

function GoalRoute(): ReactElement {
  const { goalId } = Route.useSearch()

  return (
    <ProtectedRoute requireAuth redirectTo="/">
      <GoalsAppScreen initialGoalId={goalId} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/goal')({
  component: GoalRoute,
  validateSearch,
})
