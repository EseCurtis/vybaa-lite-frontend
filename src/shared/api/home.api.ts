import { http } from '@/shared/api/http'

export interface HomeStats {
  goals: {
    pending: number
    completed: number
    skipped: number
    total: number
  }
  todayProgress: {
    completed: number
    total: number
    percentage: number
  }
}

export interface HomeStatsResponse {
  msg: string
  data: HomeStats
}

class HomeAPI {
  private base = '/api/v1/home'

  async getStats(): Promise<HomeStatsResponse> {
    const { data } = await http.get<HomeStatsResponse>(`${this.base}/stats`)
    return data
  }
}

export const homeAPI = new HomeAPI()

