import { chillAPI } from '@/shared/api/chill.api'
import { chillQueryKeys } from '@/shared/api/chill.query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/providers/toast.provider'

/**
 * Hook to create a chill session
 */
export function useCreateChillSession() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (emotion: string) => chillAPI.createSession(emotion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chillQueryKeys.sessions() })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create chill session')
    },
  })
}

/**
 * Hook to complete a chill session
 */
export function useCompleteChillSession() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ sessionId, postSessionMood }: { sessionId: string; postSessionMood?: string }) =>
      chillAPI.completeSession(sessionId, postSessionMood),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chillQueryKeys.sessions() })
      queryClient.invalidateQueries({ queryKey: chillQueryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: chillQueryKeys.all })
      toast.success('Session completed! Well done.')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete session')
    },
  })
}

/**
 * Hook to get emotion summary only
 */
export function useEmotionSummary() {
  return useQuery({
    queryKey: chillQueryKeys.summary(),
    queryFn: async () => {
      const response = await chillAPI.getEmotionSummary()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour (summary is cached for 24h on backend)
  })
}

/**
 * Hook to get paginated sessions
 */
export function usePaginatedChillSessions(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: chillQueryKeys.paginatedSessions(page, limit),
    queryFn: async () => {
      const response = await chillAPI.getPaginatedSessions(page, limit)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    keepPreviousData: true, // Keep previous data while loading new page
  })
}

/**
 * Hook to get chill sessions
 */
export function useChillSessions(limit: number = 20) {
  return useQuery({
    queryKey: chillQueryKeys.sessionsList(limit),
    queryFn: async () => {
      const response = await chillAPI.getSessions(limit)
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to get chill stats
 */
export function useChillStats() {
  return useQuery({
    queryKey: chillQueryKeys.stats(),
    queryFn: async () => {
      const response = await chillAPI.getStats()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
