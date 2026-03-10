import { useToast } from '@/providers/toast.provider'
import { rewardsAPI } from '@/shared/api/rewards.api'
import { useQuery } from '@tanstack/react-query'

export const rewardsQueryKeys = {
  all: ['rewards'] as const,
  detail: () => [...rewardsQueryKeys.all, 'detail'] as const,
}

export function useRewards() {
  const toast = useToast()
  return useQuery({
    queryKey: rewardsQueryKeys.detail(),
    queryFn: async () => {
      const response = await rewardsAPI.getRewards()
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    onError: (error: any) => {
      const message = error?.response?.data?.msg || error?.message || 'Failed to fetch rewards'
      toast.error(message)
    },
  })
}
