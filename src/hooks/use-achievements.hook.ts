import { achievementAPI } from '@/shared/api/achievement.api'
import { achievementQueryKeys } from '@/shared/api/achievement.query-keys'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to fetch user's achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: achievementQueryKeys.list(),
    queryFn: async () => {
      const response = await achievementAPI.getAchievements()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch achievement stats
 */
export function useAchievementStats() {
  return useQuery({
    queryKey: achievementQueryKeys.stats(),
    queryFn: async () => {
      const response = await achievementAPI.getAchievementStats()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch badge definitions (for showing locked badges)
 */
export function useBadgeDefinitions() {
  return useQuery({
    queryKey: achievementQueryKeys.definitions(),
    queryFn: async () => {
      const response = await achievementAPI.getBadgeDefinitions()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour (rarely changes)
  })
}
