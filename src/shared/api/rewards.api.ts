import { http } from './http'

const API_V1 = '/api/v1'

export interface RewardsData {
  balance: number
  pendingPoints: number
  pendingBreakdown: Array<{
    goalId: string
    goalText: string
    currentDay: number
    targetDays: number
    pendingPoints: number
    community: {
      id: string
      name: string
    } | null
  }>
}

export const rewardsAPI = {
  getRewards: async (): Promise<{ data: RewardsData }> => {
    const response = await http.get(`${API_V1}/users/rewards`)
    return response.data
  },
}
