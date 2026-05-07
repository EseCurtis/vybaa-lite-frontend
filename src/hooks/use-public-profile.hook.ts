import { userAPI } from '@/shared/api/user.api'
import { useQuery } from '@tanstack/react-query'

export const publicProfileQueryKeys = {
  all: ['publicProfile'] as const,
  detail: (username: string) =>
    [...publicProfileQueryKeys.all, username] as const,
}

export function usePublicProfile(username: string) {
  return useQuery({
    queryKey: publicProfileQueryKeys.detail(username),
    queryFn: async () => {
      const response = await userAPI.getPublicProfile(username)
      return response.data
    },
    enabled: Boolean(username),
    staleTime: 60 * 1000,
  })
}
