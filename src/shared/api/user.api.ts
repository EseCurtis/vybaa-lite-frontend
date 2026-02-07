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
  async registerFCMToken(fcmToken: string): Promise<{ msg: string }> {
    const { data: res } = await http.post<{ msg: string }>(
      `${API_V1}/users/fcm-token`,
      { fcmToken }
    )
    return res
  }

  async removeFCMToken(fcmToken: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/users/fcm-token`,
      { data: { fcmToken } }
    )
    return res
  }

  async syncFCMToken(token: string): Promise<{ msg: string; data: any }> {
    // Backward compatibility - calls registerFCMToken
    return this.registerFCMToken(token)
  }

  async getStats(): Promise<{ msg: string; data: UserStats }> {
    const { data: res } = await http.get<{ msg: string; data: UserStats }>(
      `${API_V1}/users/me/stats`
    )
    return res
  }
}

export const userAPI = new UserAPI()

