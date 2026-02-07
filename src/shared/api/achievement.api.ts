import { http } from '@/shared/api/http'

const API_V1 = '/api/v1'

export interface Achievement {
  id: string
  userId: string
  goalId?: string
  type: 'streak_milestone' | 'goal_completed' | 'total_goals' | 'total_checkins' | 'perfect_week' | 'comeback' | 'early_bird' | 'night_owl'
  milestone: number
  title: string
  description: string
  badgeIcon: string
  earnedAt: string
}

export interface BadgeDefinition {
  type: string
  milestone: number
  title: string
  description: string
  badgeIcon: string
}

export interface AchievementStats {
  totalBadges: number
  recentBadges: Array<{
    id: string
    title: string
    badgeIcon: string
    earnedAt: string
  }>
  byType: {
    streak_milestone: number
    total_goals: number
    total_checkins: number
    perfect_week: number
    comeback: number
    early_bird: number
    night_owl: number
  }
}

export interface AchievementsResponse {
  msg: string
  data: Achievement[]
}

export interface AchievementStatsResponse {
  msg: string
  data: AchievementStats
}

export interface BadgeDefinitionsResponse {
  msg: string
  data: BadgeDefinition[]
}

class AchievementAPI {
  async getAchievements(): Promise<AchievementsResponse> {
    const { data: res } = await http.get<AchievementsResponse>(`${API_V1}/achievements`)
    return res
  }

  async getAchievementStats(): Promise<AchievementStatsResponse> {
    const { data: res } = await http.get<AchievementStatsResponse>(`${API_V1}/achievements/stats`)
    return res
  }

  async getBadgeDefinitions(): Promise<BadgeDefinitionsResponse> {
    const { data: res } = await http.get<BadgeDefinitionsResponse>(`${API_V1}/achievements/definitions`)
    return res
  }
}

export const achievementAPI = new AchievementAPI()
