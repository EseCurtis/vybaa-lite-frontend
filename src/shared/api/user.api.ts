import { http } from './http'

const API_V1 = '/api/v1'

export interface UserStats {
  streakCount: number
  points: number
  activeDays: number
  currentMood: string | null
  totalTasksCompleted: number
  totalJournals: number
}

class UserAPI {
  async syncFCMToken(token: string): Promise<{ msg: string; data: any }> {
    const { data: res } = await http.post<{ msg: string; data: any }>(
      `${API_V1}/users/me/sync-fcm`,
      { token }
    )
    return res
  }

  async getStats(): Promise<{ msg: string; data: UserStats }> {
    const { data: res } = await http.get<{ msg: string; data: UserStats }>(
      `${API_V1}/users/me/stats`
    )
    return res
  }
}

export const userAPI = new UserAPI()

