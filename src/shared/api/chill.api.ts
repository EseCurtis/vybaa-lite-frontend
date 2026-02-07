import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface ChillSuggestion {
  duration: number
  affirms: string[]
}

export interface ChillSession {
  id: string
  userId: string
  emotion: string
  duration: number
  completed: boolean
  completedAt?: string
  postSessionMood?: string
  createdAt: string
}

export interface ChillSessionRequest {
  emotion: string
}

export interface ChillSessionResponse {
  msg: string
  data: {
    sessionId: string
    suggestedTimes: ChillSuggestion[]
  }
}

export interface ChillSessionsResponse {
  msg: string
  data: ChillSession[]
}

export interface ChillStatsResponse {
  msg: string
  data: {
    totalSessions: number
    completedSessions: number
    totalMinutes: number
    averageDuration: number
  }
}

class ChillAPI {
  async createSession(emotion: string): Promise<ChillSessionResponse> {
    const { data: res } = await http.post<ChillSessionResponse>(`${API_V1}/chill/sessions`, {
      emotion,
    })
    return res
  }

  async updateSessionDuration(sessionId: string, duration: number): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(
      `${API_V1}/chill/sessions/${sessionId}/duration`,
      { duration }
    )
    return res
  }

  async completeSession(sessionId: string, postSessionMood?: string): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(
      `${API_V1}/chill/sessions/${sessionId}/complete`,
      { postSessionMood }
    )
    return res
  }

  async getSessions(limit: number = 20): Promise<ChillSessionsResponse> {
    const { data: res } = await http.get<ChillSessionsResponse>(`${API_V1}/chill/sessions`, {
      params: { limit },
    })
    return res
  }

  async getStats(): Promise<ChillStatsResponse> {
    const { data: res} = await http.get<ChillStatsResponse>(`${API_V1}/chill/stats`)
    return res
  }

  async getEmotionSummary(): Promise<{
    msg: string
    data: {
      summary: string
      summaryGenerated: boolean
    }
  }> {
    const { data: res } = await http.get<{
      msg: string
      data: {
        summary: string
        summaryGenerated: boolean
      }
    }>(`${API_V1}/chill/summary`)
    return res
  }

  async getPaginatedSessions(page: number = 1, limit: number = 10): Promise<{
    msg: string
    data: {
      sessions: ChillSession[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasMore: boolean
      }
    }
  }> {
    const { data: res } = await http.get<{
      msg: string
      data: {
        sessions: ChillSession[]
        pagination: {
          page: number
          limit: number
          total: number
          totalPages: number
          hasMore: boolean
        }
      }
    }>(`${API_V1}/chill/sessions/paginated`, {
      params: { page, limit },
    })
    return res
  }
}

export const chillAPI = new ChillAPI()
