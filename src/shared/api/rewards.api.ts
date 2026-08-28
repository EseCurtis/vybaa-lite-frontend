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

export interface RewardTransaction {
  id: string
  type: string
  amount: number
  fiatAmount: number | null
  referenceId: string | null
  status: string
  createdAt: string
  metadata: {
    goalId?: string
    milestoneDay?: number
    milestoneName?: string
    source?: string
    state?: string
  }
}

export interface RewardTransactionsData {
  transactions: RewardTransaction[]
  pagination: {
    limit: number
    hasMore: boolean
    nextCursor: string | null
  }
}

export const rewardsAPI = {
  getRewards: async (): Promise<{ data: RewardsData }> => {
    const response = await http.get(`${API_V1}/users/rewards`)
    return response.data
  },
  getTransactions: async (
    cursor: string | null = null,
    limit = 20,
  ): Promise<{ data: RewardTransactionsData }> => {
    const response = await http.get(`${API_V1}/users/rewards/transactions`, {
      params: { cursor: cursor ?? undefined, limit },
    })
    return response.data
  },
}
