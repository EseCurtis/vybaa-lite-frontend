import { homeAPI } from '@/shared/api/home.api'
import { useQuery } from '@tanstack/react-query'

export const homeStatsKeys = {
  all: ['homeStats'] as const,
  stats: () => [...homeStatsKeys.all, 'stats'] as const,
}

export const useHomeStats = () => {
  return useQuery({
    queryKey: homeStatsKeys.stats(),
    queryFn: () => homeAPI.getStats(),
    staleTime: 30 * 1000, // 30 seconds - stats change frequently
    refetchOnMount: true,
  })
}


