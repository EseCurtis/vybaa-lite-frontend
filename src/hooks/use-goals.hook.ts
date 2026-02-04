import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalAPI, type Goal, type CreateGoalRequest } from '@/shared/api/goal.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { useToast } from '@/providers/toast.provider'

/**
 * Hook to fetch all goals
 */
export function useGoals() {
  return useQuery({
    queryKey: goalQueryKeys.list(),
    queryFn: async () => {
      const response = await goalAPI.getAllGoals()
      return response.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch current active goal
 */
export function useCurrentGoal() {
  return useQuery({
    queryKey: goalQueryKeys.current(),
    queryFn: async () => {
      const response = await goalAPI.getCurrentGoal()
      return response.data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to create a new goal
 */
export function useCreateGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (data: CreateGoalRequest) => goalAPI.createGoal(data),
    onSuccess: (response) => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.list() })
      // Update current goal if created
      if (response.data) {
        queryClient.setQueryData(goalQueryKeys.current(), response.data)
      }
      toast.success('Goal created successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create goal')
    },
  })
}

/**
 * Hook to check in for the day
 */
export function useCheckIn() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (goalId?: string) => goalAPI.checkIn(goalId),
    onSuccess: (response) => {
      // Invalidate and refetch current goal
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.current() })
      // Update goals list if needed
      if (response.data) {
        queryClient.setQueryData(goalQueryKeys.current(), response.data)
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.list() })
      }
      toast.success('Check-in successful! Keep it up!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Check-in failed')
    },
  })
}

/**
 * Hook to reset a goal
 */
export function useResetGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => goalAPI.resetGoal(),
    onSuccess: (response) => {
      // Invalidate and refetch current goal
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.current() })
      // Update goals list if needed
      if (response.data) {
        queryClient.setQueryData(goalQueryKeys.current(), response.data)
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.list() })
      }
    },
  })
}

/**
 * Combined hook for goal operations
 * Provides all goal-related queries and mutations in one place
 */
export function useGoalOperations() {
  const goalsQuery = useGoals()
  const currentGoalQuery = useCurrentGoal()
  const createGoalMutation = useCreateGoal()
  const checkInMutation = useCheckIn()
  const resetGoalMutation = useResetGoal()

  return {
    // Queries
    goals: goalsQuery.data || [],
    currentGoal: currentGoalQuery.data,
    isLoading: goalsQuery.isLoading || currentGoalQuery.isLoading,
    isFetching: goalsQuery.isFetching || currentGoalQuery.isFetching,
    error: goalsQuery.error || currentGoalQuery.error,
    
    // Mutations
    createGoal: createGoalMutation.mutate,
    createGoalAsync: createGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,
    
    checkIn: (goalId?: string) => checkInMutation.mutate(goalId),
    checkInAsync: (goalId?: string) => checkInMutation.mutateAsync(goalId),
    isCheckingIn: checkInMutation.isPending,
    
    resetGoal: resetGoalMutation.mutate,
    resetGoalAsync: resetGoalMutation.mutateAsync,
    isResetting: resetGoalMutation.isPending,
    
    // Refetch functions
    refetchGoals: goalsQuery.refetch,
    refetchCurrentGoal: currentGoalQuery.refetch,
  }
}
