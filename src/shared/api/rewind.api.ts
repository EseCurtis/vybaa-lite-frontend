import { getCurrentTimezone, http } from '@/shared/api/http'
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
  comparisonInsight: string | null
  journalDraft: string | null
  wellbeingSignals: RewindWellbeingSignals | null
  journalId: string | null
  journalSavedAt: string | null
  transcriptAvailable?: boolean
  turns?: RewindTurn[]
  createdAt: string
  updatedAt: string
}

export type RewindTurn = {
  id: string
  role: 'USER' | 'PARTNER'
  sequence: number
  content: string
  createdAt: string
}

export type RewindWellbeingSignals = {
  agency: number
  clarity: number
  connection: number
  emotionalSteadiness: number
  energy: number
}

export type RewindInsightsRange = '7d' | '30d' | '90d'

export type RewindInsights = {
  range: RewindInsightsRange
  coverage: {
    completedDays: number
    completedSessions: number
    days: number
  }
  hasSufficientData: boolean
  signals: RewindWellbeingSignals | null
  deltas: RewindWellbeingSignals | null
  progress: {
    clarity: number
    consistency: number
    momentum: number
  } | null
  contextualInsight: string | null
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

export type RewindSessionResponse = {
  msg: string
  data: RewindSession
}

export type RewindInsightsResponse = {
  msg: string
  data: RewindInsights
}

export type AddRewindToJournalResponse = {
  msg: string
  data: {
    journal: {
      id: string
      content: string
      date: string
    }
    saved: boolean
  }
}

class RewindAPI {
  async createLiveToken(
    personaId: RewindPersonaId,
    sessionId?: string | null,
  ): Promise<RewindLiveTokenResponse> {
    const { data: res } = await http.post<RewindLiveTokenResponse>(
      `${API_V1}/rewind/live-token`,
      { personaId, sessionId, timezone: getCurrentTimezone() },
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

  async getSession(sessionId: string): Promise<RewindSessionResponse> {
    const { data: res } = await http.get<RewindSessionResponse>(
      `${API_V1}/rewind/sessions/${sessionId}`,
    )
    return res
  }

  async getInsights(range: RewindInsightsRange): Promise<RewindInsightsResponse> {
    const { data: res } = await http.get<RewindInsightsResponse>(
      `${API_V1}/rewind/insights`,
      { params: { range } },
    )
    return res
  }

  async addSessionToJournal(
    sessionId: string,
  ): Promise<AddRewindToJournalResponse> {
    const { data: res } = await http.post<AddRewindToJournalResponse>(
      `${API_V1}/rewind/sessions/${sessionId}/add-to-journal`,
    )
    return res
  }
}

export const rewindAPI = new RewindAPI()
