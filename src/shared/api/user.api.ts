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

export interface UsernameAvailability {
  canChange: boolean
  daysRemaining: number
  nextAvailableDate: string
  currentUsername?: string
}

export interface PublicProfileStats {
  achievementCount: number
  communityCount: number
  goalCount: number
  journalCount: number
}

export interface PublicProfile {
  id: string
  username: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  currentMood: string | null
  joinedAt: string
  playPoints: number
  stats: PublicProfileStats
}

class UserAPI {
  async registerFCMToken(fcmToken: string): Promise<{ msg: string }> {
    const { data: res } = await http.post<{ msg: string }>(
      `${API_V1}/users/fcm-token`,
      { fcmToken },
    )
    return res
  }

  async removeFCMToken(fcmToken: string): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/users/fcm-token`,
      { data: { fcmToken } },
    )
    return res
  }

  async syncFCMToken(token: string): Promise<{ msg: string }> {
    // Backward compatibility - calls registerFCMToken
    return this.registerFCMToken(token)
  }

  async getStats(): Promise<{ msg: string; data: UserStats }> {
    const { data: res } = await http.get<{ msg: string; data: UserStats }>(
      `${API_V1}/users/me/stats`,
    )
    return res
  }

  async checkUsernameAvailability(): Promise<{
    msg: string
    data: UsernameAvailability
  }> {
    const { data: res } = await http.get<{
      msg: string
      data: UsernameAvailability
    }>(`${API_V1}/users/username/availability`)
    return res
  }

  async checkUsernameExists(username: string): Promise<{
    msg: string
    data: {
      available: boolean
      exists?: boolean
      reason?: string
      isCurrentUsername?: boolean
    }
  }> {
    const { data: res } = await http.get(`${API_V1}/users/username/check`, {
      params: { username },
    })
    return res
  }

  async getPublicProfile(username: string): Promise<{
    msg: string
    data: PublicProfile
  }> {
    const { data: res } = await http.get<{
      msg: string
      data: PublicProfile
    }>(`${API_V1}/users/public/${username}`)
    return res
  }

  async deleteAccount(): Promise<{ msg: string }> {
    const { data: res } = await http.delete<{ msg: string }>(
      `${API_V1}/users/me`,
    )
    return res
  }
}

export const userAPI = new UserAPI()
