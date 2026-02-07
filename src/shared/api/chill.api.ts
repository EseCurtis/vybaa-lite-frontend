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

  async completeSession(sessionId: string): Promise<{ msg: string }> {
    const { data: res } = await http.patch<{ msg: string }>(
      `${API_V1}/chill/sessions/${sessionId}/complete`
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
}

export const chillAPI = new ChillAPI()
