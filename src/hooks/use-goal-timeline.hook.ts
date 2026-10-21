import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { goalTimelineAPI } from '@/shared/api/goal-timeline.api'
import type {
  GoalTimelineResponse,
  TimelinePageRequest,
} from '@/shared/api/goal-timeline.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'

const initialPage: TimelinePageRequest = {}

export function useGoalTimeline(goalId: string, active: boolean) {
  const [session, setSession] = useState(() => crypto.randomUUID())
  const client = useQueryClient()
  const anchor = useRef<{ session: string; date?: string }>({ session })
  useEffect(() => {
    const queryKey = [...goalQueryKeys.occurrences(goalId), 'today', session]
    if (!active) void client.cancelQueries({ queryKey })
    return () => {
      void client.cancelQueries({ queryKey })
    }
  }, [active, client, goalId, session])
  const query = useInfiniteQuery({
    queryKey: [...goalQueryKeys.occurrences(goalId), 'today', session],
    enabled: active,
    initialPageParam: initialPage,
    queryFn: async ({ pageParam, signal }): Promise<GoalTimelineResponse> => {
      const result = await goalTimelineAPI.list(
        goalId,
        pageParam,
        anchor.current.session === session ? anchor.current.date : undefined,
        signal,
      )
      if (anchor.current.session === session)
        anchor.current = { session, date: result.pagination.anchorDate }
      return result
    },
    getPreviousPageParam: (
      first: GoalTimelineResponse,
    ): TimelinePageRequest | undefined =>
      first.pagination.previousCursor
        ? { cursor: first.pagination.previousCursor, direction: 'before' }
        : undefined,
    getNextPageParam: (
      last: GoalTimelineResponse,
    ): TimelinePageRequest | undefined =>
      last.pagination.nextCursor
        ? { cursor: last.pagination.nextCursor, direction: 'after' }
        : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
  function refresh(): void {
    const next = crypto.randomUUID()
    anchor.current = { session: next }
    setSession(next)
  }
  const unique = new Map(
    query.data?.pages
      .flatMap((page) => page.data)
      .map((item) => [item.id, item]),
  )
  const items = [...unique.values()].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id),
  )
  return {
    ...query,
    items,
    anchorDate: query.data?.pages[0]?.pagination.anchorDate,
    refresh,
  }
}
