import GoalDetailScreen from '@/app/(goal)/detail.screen'
import type { GoalListFilter } from '@/shared/api/goal.api'
import { parseGoalListFilter } from '@/shared/goal/goal-library-filter.util'
import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

type GoalDetailSearch = {
  from?: GoalListFilter
}

function validateSearch(search: Record<string, unknown>): GoalDetailSearch {
  const from = parseGoalListFilter(search.from)
  return from ? { from } : {}
}

function GoalDetailRoute(): ReactElement {
  const { from = 'ACTIVE' } = Route.useSearch()
  return <GoalDetailScreen originFilter={from} />
}

export const Route = createFileRoute('/app/goal/$goalId')({
  component: GoalDetailRoute,
  validateSearch,
})
