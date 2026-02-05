import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface InsightsSummary {
  totalGoals: number
  totalCheckIns: number
  completedDays: number
  totalDays: number
  averageProgress: number
  longestStreak: number
  completionRate: number
  currentStreak: number
}

export interface ChartDataPoint {
  date: string
  checkIns: number
}

export interface InsightsData {
  summary: InsightsSummary
  chartData: ChartDataPoint[]
}

export interface InsightsResponse {
  msg: string
  data: InsightsData
}

class InsightsAPI {
  async getInsights(): Promise<InsightsResponse> {
    const { data: res } = await http.get<InsightsResponse>(`${API_V1}/insights`)
    return res
  }
}

export const insightsAPI = new InsightsAPI()
