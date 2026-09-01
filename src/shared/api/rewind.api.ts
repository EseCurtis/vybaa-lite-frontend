import { http } from '@/shared/api/http'
import type { GoalSchedule, GoalTarget } from '@/shared/api/goal.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

const API_V1 = '/api/v1'

export type RewindSession = {
  id: string
  userId: string
  personaId: RewindPersonaId
  sessionDateKey: string | null
  scheduledFor: string | null
  windowEndsAt: string | null
  startedAt: string | null
  status:
    | 'LEGACY'
    | 'SCHEDULED'
    | 'IN_PROGRESS'
    | 'FINALIZING'
    | 'COMPLETED'
    | 'MISSED'
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
  recommendations?: RewindRecommendation[]
  createdAt: string
  updatedAt: string
}

export type RewindRecommendation =
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        amount?: number
        goalId: string
        notes?: string
        occurrenceId: string
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'GOAL_PROGRESS'
    }
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        description?: string
        reminderTimes: string[]
        schedule: GoalSchedule
        target: GoalTarget
        title: string
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'NEW_GOAL'
    }
  | {
      acceptedAt: string | null
      createdAt: string
      dismissedAt: string | null
      expiredAt: string | null
      id: string
      payload: {
        achievementId?: string
        cardType: 'achievement' | 'daily' | 'rewind' | 'streak' | 'weekly'
      }
      rationale: string
      status: RewindRecommendationStatus
      title: string
      type: 'FLEXX'
    }

export type RewindRecommendationStatus =
  | 'ACCEPTED'
  | 'DISMISSED'
  | 'EXPIRED'
  | 'PENDING'

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
    sessionDateKey: string | null
    scheduledFor: string | null
    windowEndsAt: string | null
  }
}

export type RewindRoutineFrequency =
  | 'MORNINGS_AND_EVENINGS'
  | 'JUST_MORNINGS'
  | 'JUST_EVENINGS'
  | 'CUSTOM'

export type RewindRoutineIntent =
  | 'UNDERSTAND_EMOTIONS'
  | 'SPOT_PATTERNS'
  | 'BUILD_SMALL_CHANGES'
  | 'CUSTOM'

export type RewindRoutine = {
  id: string
  frequency: RewindRoutineFrequency
  times: string[]
  intent: RewindRoutineIntent
  customIntent: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export type RewindOccurrence = {
  id: string
  scheduledFor: string | null
  status: RewindSession['status']
  windowEndsAt: string | null
}

export type RewindRoutineOverview = {
  currentSession: RewindOccurrence | null
  latestSession: RewindOccurrence | null
  nextSession: RewindOccurrence | null
  routine: RewindRoutine | null
  timezone: string
}

export type RewindRoutineResponse = {
  msg: string
  data: RewindRoutineOverview
}

export type UpdateRewindRoutineInput = {
  frequency: RewindRoutineFrequency
  intent: RewindRoutineIntent
  times?: string[]
  customIntent?: string | null
  timezone: string
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
  async acceptRecommendation(
    sessionId: string,
    recommendationId: string,
  ): Promise<{ data: RewindRecommendation; msg: string }> {
    const { data: response } = await http.post<{
      data: RewindRecommendation
      msg: string
    }>(
      `${API_V1}/rewind/sessions/${sessionId}/recommendations/${recommendationId}/accept`,
    )
    return response
  }

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

  async getRoutine(): Promise<RewindRoutineResponse> {
    const { data: res } = await http.get<RewindRoutineResponse>(
      `${API_V1}/rewind/routine`,
    )
    return res
  }

  async updateRoutine(
    input: UpdateRewindRoutineInput,
  ): Promise<RewindRoutineResponse> {
    const { data: res } = await http.put<RewindRoutineResponse>(
      `${API_V1}/rewind/routine`,
      input,
    )
    return res
  }

  async getSession(sessionId: string): Promise<RewindSessionResponse> {
    const { data: res } = await http.get<RewindSessionResponse>(
      `${API_V1}/rewind/sessions/${sessionId}`,
    )
    return res
  }

  async getInsights(
    range: RewindInsightsRange,
  ): Promise<RewindInsightsResponse> {
    const { data: res } = await http.get<RewindInsightsResponse>(
      `${API_V1}/rewind/insights`,
      { params: { range } },
    )
    return res
  }

  async dismissRecommendation(
    sessionId: string,
    recommendationId: string,
  ): Promise<{ data: RewindRecommendation; msg: string }> {
    const { data: response } = await http.post<{
      data: RewindRecommendation
      msg: string
    }>(
      `${API_V1}/rewind/sessions/${sessionId}/recommendations/${recommendationId}/dismiss`,
    )
    return response
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
