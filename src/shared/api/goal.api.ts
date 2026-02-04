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
}

export interface CreateGoalRequest {
  goalText: string
  targetDays: number
}

export interface GoalResponse {
  msg: string
  data: Goal | null
}

export interface GoalsListResponse {
  msg: string
  data: Goal[]
}

class GoalAPI {
  async createGoal(data: CreateGoalRequest): Promise<GoalResponse> {
    const { data: res } = await http.post<GoalResponse>(`${API_V1}/goals`, data)
    return res
  }

  async getAllGoals(): Promise<GoalsListResponse> {
    const { data: res } = await http.get<GoalsListResponse>(`${API_V1}/goals`)
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
}

export const goalAPI = new GoalAPI()
