import { http } from '@/shared/api/http'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const API_V1 = '/api/v1'

export type RewindSession = {
  id: string
  userId: string
  personaId: RewindPersonaId
  sessionDateKey: string | null
  completed: boolean
  completedAt: string | null
  checkInAt: string | null
  summary: string
  emotionalInsight: string | null
  emotionalTags: string[]
  nextStepNote: string | null
  createdAt: string
  updatedAt: string
}

export type RewindLiveTokenResponse = {
  msg: string
  data: {
    token: string
    wsUrl: string
    personaId: RewindPersonaId
    sessionId: string
    sessionDateKey: string
  }
}

export type RewindSessionsFilters = {
  day?: string
  personaId?: RewindPersonaId
}

export type RewindSessionsFacets = {
  days: Array<{
    count: number
    key: string
  }>
  partners: Array<{
    count: number
    id: RewindPersonaId
  }>
}

export type RewindSessionsSummary = {
  completed: number
  open: number
  total: number
}

export type PaginatedRewindSessionsResponse = {
  msg: string
  data: {
    filters: RewindSessionsFacets
    summary: RewindSessionsSummary
    sessions: RewindSession[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasMore: boolean
    }
  }
}

class RewindAPI {
  async createLiveToken(
    personaId: RewindPersonaId,
    sessionId?: string | null,
  ): Promise<RewindLiveTokenResponse> {
    const { data: res } = await http.post<RewindLiveTokenResponse>(
      `${API_V1}/rewind/live-token`,
      { personaId, sessionId },
    )
    return res
  }

  async getPaginatedSessions(
    page: number = 1,
    limit: number = 10,
    filters?: RewindSessionsFilters,
  ): Promise<PaginatedRewindSessionsResponse> {
    const { data: res } = await http.get<PaginatedRewindSessionsResponse>(
      `${API_V1}/rewind/sessions`,
      {
        params: {
          day: filters?.day,
          limit,
          page,
          personaId: filters?.personaId,
        },
      },
    )
    return res
  }
}

export const rewindAPI = new RewindAPI()
