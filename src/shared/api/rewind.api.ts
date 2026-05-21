import { http } from '@/shared/api/http'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const API_V1 = '/api/v1'

export type RewindGuidedQuestionId =
  | 'meaningful'
  | 'draining'
  | 'progress'
  | 'different'
  | 'tomorrow_need'

export type RewindGuidedResponse = {
  questionId: RewindGuidedQuestionId
  shortSummary: string
  score: number | null
  updatedAt: number
}

export type RewindGuidedFlowState = {
  openingAnswered: boolean
  currentQuestionIndex: number
  completed: boolean
  responses: Partial<Record<RewindGuidedQuestionId, RewindGuidedResponse>>
}

export type RewindSession = {
  id: string
  userId: string
  personaId: RewindPersonaId
  sessionDateKey: string | null
  openingAnswered: boolean
  currentQuestionIndex: number
  completed: boolean
  responses: RewindGuidedFlowState['responses']
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
  }
}

export type PaginatedRewindSessionsResponse = {
  msg: string
  data: {
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
  ): Promise<PaginatedRewindSessionsResponse> {
    const { data: res } = await http.get<PaginatedRewindSessionsResponse>(
      `${API_V1}/rewind/sessions`,
      {
        params: { page, limit },
      },
    )
    return res
  }
}

export const rewindAPI = new RewindAPI()
