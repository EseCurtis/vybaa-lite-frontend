import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface Goal {
  id: string
  goalText: string
  targetDays: number
  currentDay: number
  lastCheckInDate: string | null
  startedAt: string
  wasReset?: boolean
  canCheckIn: boolean
}

export interface CreateGoalRequest {
  goalText: string
  targetDays: number
}

export interface UpdateGoalRequest {
  goalText?: string
  targetDays?: number
}

export interface GoalResponse {
  msg: string
  data: Goal | null
}

export interface PaginationMeta {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface GoalsListResponse {
  msg: string
  data: Goal[]
  pagination: PaginationMeta
}

class GoalAPI {
  async createGoal(data: CreateGoalRequest): Promise<GoalResponse> {
    const { data: res } = await http.post<GoalResponse>(`${API_V1}/goals`, data)
    return res
  }

  async getAllGoals(page: number = 1, limit: number = 10): Promise<GoalsListResponse> {
    const { data: res } = await http.get<GoalsListResponse>(`${API_V1}/goals`, {
      params: { page, limit },
    })
    return res
  }

  async getCurrentGoal(): Promise<GoalResponse> {
    const { data: res } = await http.get<GoalResponse>(`${API_V1}/goals/current`)
    return res
  }

  async checkIn(goalId?: string): Promise<GoalResponse> {
    const { data: res } = await http.post<GoalResponse>(`${API_V1}/goals/check-in`, goalId ? { goalId } : {})
    return res
  }

  async resetGoal(): Promise<GoalResponse> {
    const { data: res } = await http.post<GoalResponse>(`${API_V1}/goals/reset`, {})
    return res
  }

  async updateGoal(goalId: string, data: UpdateGoalRequest): Promise<GoalResponse> {
    const { data: res } = await http.put<GoalResponse>(`${API_V1}/goals/${goalId}`, data)
    return res
  }

  async deleteGoal(goalId: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(`${API_V1}/goals/${goalId}`)
    return res
  }
}

export const goalAPI = new GoalAPI()
