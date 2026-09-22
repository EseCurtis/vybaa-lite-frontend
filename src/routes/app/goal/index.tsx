import GoalsAppScreen from '@/app/(goal)/index.screen'
import type { GoalListFilter } from '@/shared/api/goal.api'
import { parseGoalListFilter } from '@/shared/goal/goal-library-filter.util'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

type GoalIndexSearch = {
  filter?: GoalListFilter
  goalId?: string
}

function validateSearch(search: Record<string, unknown>): GoalIndexSearch {
  const filter = parseGoalListFilter(search.filter)
  const goalId = typeof search.goalId === 'string' ? search.goalId : undefined
  return { filter, goalId }
}

function GoalIndexRoute(): ReactElement {
  const { filter = 'ACTIVE' } = Route.useSearch()
  return <GoalsAppScreen filter={filter} />
}

export const Route = createFileRoute('/app/goal/')({
  component: GoalIndexRoute,
  validateSearch,
})
