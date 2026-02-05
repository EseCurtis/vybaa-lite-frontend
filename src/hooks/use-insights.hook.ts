import { insightsAPI } from '@/shared/api/insights.api'
import { insightsQueryKeys } from '@/shared/api/insights.query-keys'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to fetch user insights and analytics
 * Uses optimized backend aggregation queries for scalability
 */
export function useInsights() {
  return useQuery({
    queryKey: insightsQueryKeys.summary(),
    queryFn: async () => {
      const response = await insightsAPI.getInsights()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - insights don't need real-time updates
  })
}
