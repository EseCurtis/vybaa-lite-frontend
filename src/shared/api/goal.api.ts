import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface Goal {
  id: string
  goalText: string
  targetDays: number
  currentDay: number
  lastCheckInDate: string | null
  startedAt: string
  reminderTime?: string | null
  wasReset?: boolean
  canCheckIn: boolean
  templateId?: string | null
  communityId?: string | null
  community?: {
    id: string
    name: string
  } | null
}

export interface CreateGoalRequest {
  goalText: string
  targetDays: number
  reminderTime?: string
}

export interface UpdateGoalRequest {
  goalText?: string
  targetDays?: number
  reminderTime?: string | null
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

  async getAllGoals(page: number = 1, limit: number = 10, canCheckIn?: boolean): Promise<GoalsListResponse> {
    const params: any = { page, limit }
    if (canCheckIn !== undefined) {
      params.canCheckIn = canCheckIn
    }
    const { data: res } = await http.get<GoalsListResponse>(`${API_V1}/goals`, { params })
    return res
  }

  async getCurrentGoal(): Promise<GoalResponse> {
    const { data: res } = await http.get<GoalResponse>(`${API_V1}/goals/current`)
    return res
  }

  async checkIn(
    goalId?: string,
    notes?: string,
    attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
  ): Promise<GoalResponse> {
    const payload: any = {}
    if (goalId) payload.goalId = goalId
    if (notes) payload.notes = notes
    if (attachments && attachments.length > 0) payload.attachments = attachments
    
    const { data: res } = await http.post<GoalResponse>(`${API_V1}/goals/check-in`, payload)
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

  async bulkDeleteGoals(goalIds: string[]): Promise<{ 
    msg: string
    data: {
      deleted: number
      notFound: number
      total: number
    }
  }> {
    const { data: res } = await http.post<{ 
      msg: string
      data: {
        deleted: number
        notFound: number
        total: number
      }
    }>(`${API_V1}/goals/bulk-delete`, { goalIds })
    return res
  }
}

export const goalAPI = new GoalAPI()
