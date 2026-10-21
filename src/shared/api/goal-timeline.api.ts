import type { GoalOccurrencesResponse } from './goal.api'
import { http } from './http'

export interface GoalTimelineResponse extends GoalOccurrencesResponse {
  pagination: GoalOccurrencesResponse['pagination'] & {
    anchorDate: string
    hasNextPage: boolean
    hasPreviousPage: boolean
    previousCursor: string | null
  }
}

export interface TimelinePageRequest {
  cursor?: string
  direction?: 'after' | 'before'
}

export const goalTimelineAPI = {
  async list(
    goalId: string,
    page: TimelinePageRequest,
    anchorDate?: string,
    signal?: AbortSignal,
  ): Promise<GoalTimelineResponse> {
    return (
      await http.get<GoalTimelineResponse>(
        `/api/v2/goals/${encodeURIComponent(goalId)}/occurrences`,
        {
          signal,
          params: { ...page, anchor: 'today', anchorDate, limit: 20 },
        },
      )
    ).data
  },
}
