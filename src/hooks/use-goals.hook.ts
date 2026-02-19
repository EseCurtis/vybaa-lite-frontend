import { useToast } from '@/providers/toast.provider'
import { goalAPI, type CreateGoalRequest, type UpdateGoalRequest } from '@/shared/api/goal.api'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { insightsQueryKeys } from '@/shared/api/insights.query-keys'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Hook to fetch all goals with pagination and optional canCheckIn filter
 */
export function useGoals(page: number = 1, limit: number = 10, canCheckIn?: boolean) {
  return useQuery({
    queryKey: [...goalQueryKeys.list(page, limit), { canCheckIn }],
    queryFn: async () => {
      const response = await goalAPI.getAllGoals(page, limit, canCheckIn)
      return response
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch goals with infinite scrolling and optional canCheckIn filter
 */
export function useInfiniteGoals({ limit = 10, canCheckIn }: { limit?: number; canCheckIn?: boolean } = {}) {
  return useInfiniteQuery({
    queryKey: [...goalQueryKeys.infinite(limit), { canCheckIn }],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await goalAPI.getAllGoals(pageParam, limit, canCheckIn)
      return response
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    getPreviousPageParam: (firstPage) => {
      if (firstPage.pagination?.hasPrevPage) {
        return firstPage.pagination.page - 1
      }
      return undefined
    },
    initialPageParam: 1,
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
      // Invalidate all goals lists (paginated and infinite)
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      // Invalidate insights to refresh stats
      queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
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
    mutationFn: ({
      goalId,
      notes,
      attachments,
    }: {
      goalId?: string
      notes?: string
      attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
    } = {}) => goalAPI.checkIn(goalId, notes, attachments),
    onSuccess: (response) => {
      // Invalidate and refetch current goal
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.current() })
      // Invalidate insights to refresh stats
      queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
      // Update goals list if needed
      if (response.data) {
        queryClient.setQueryData(goalQueryKeys.current(), response.data)
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
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
      // Invalidate insights to refresh stats
      queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
      // Update goals list if needed
      if (response.data) {
        queryClient.setQueryData(goalQueryKeys.current(), response.data)
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      }
    },
  })
}

/**
 * Hook to update a goal
 */
export function useUpdateGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: UpdateGoalRequest }) =>
      goalAPI.updateGoal(goalId, data),
    onSuccess: (response) => {
      // Invalidate all goals lists (paginated and infinite)
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.lists() })
      // Invalidate insights to refresh stats
      queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
      // Update current goal if it was the one updated
      if (response.data) {
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.current() })
        queryClient.invalidateQueries({ queryKey: goalQueryKeys.detail(response.data.id) })
      }
      toast.success('Goal updated successfully!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update goal')
    },
  })
}

/**
 * Hook to delete a goal
 */
export function useDeleteGoal() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (goalId: string) => goalAPI.deleteGoal(goalId),
    onSuccess: (_, goalId) => {
      // Invalidate and refetch goals list
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.list() })
      // Invalidate insights to refresh stats
      queryClient.invalidateQueries({ queryKey: insightsQueryKeys.all })
      // Invalidate current goal if it was deleted
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.current() })
      // Remove from cache
      queryClient.removeQueries({ queryKey: goalQueryKeys.detail(goalId) })
      toast.success('Goal deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete goal')
    },
  })
}

/**
 * Combined hook for goal operations
 * Provides all goal-related queries and mutations in one place
 */
export function useGoalOperations(page: number = 1, limit: number = 10, canCheckIn?: boolean) {
  const goalsQuery = useGoals(page, limit, canCheckIn)
  const currentGoalQuery = useCurrentGoal()
  const createGoalMutation = useCreateGoal()
  const checkInMutation = useCheckIn()
  const resetGoalMutation = useResetGoal()
  const updateGoalMutation = useUpdateGoal()
  const deleteGoalMutation = useDeleteGoal()

  return {
    // Queries
    goals: goalsQuery.data?.data || [],
    pagination: goalsQuery.data?.pagination,
    currentGoal: currentGoalQuery.data,
    isLoading: goalsQuery.isLoading || currentGoalQuery.isLoading,
    isFetching: goalsQuery.isFetching || currentGoalQuery.isFetching,
    error: goalsQuery.error || currentGoalQuery.error,

    // Mutations
    createGoal: createGoalMutation.mutate,
    createGoalAsync: createGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,

    checkIn: (
      goalId?: string,
      notes?: string,
      attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
    ) => checkInMutation.mutate({ goalId, notes, attachments }),
    checkInAsync: (
      goalId?: string,
      notes?: string,
      attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
    ) => checkInMutation.mutateAsync({ goalId, notes, attachments }),
    isCheckingIn: checkInMutation.isPending,

    resetGoal: resetGoalMutation.mutate,
    resetGoalAsync: resetGoalMutation.mutateAsync,
    isResetting: resetGoalMutation.isPending,

    updateGoal: (goalId: string, data: UpdateGoalRequest) => updateGoalMutation.mutate({ goalId, data }),
    updateGoalAsync: (goalId: string, data: UpdateGoalRequest) => updateGoalMutation.mutateAsync({ goalId, data }),
    isUpdating: updateGoalMutation.isPending,

    deleteGoal: deleteGoalMutation.mutate,
    deleteGoalAsync: deleteGoalMutation.mutateAsync,
    isDeleting: deleteGoalMutation.isPending,

    // Refetch functions
    refetchGoals: goalsQuery.refetch,
    refetchCurrentGoal: currentGoalQuery.refetch,
  }
}

/**
 * Combined hook for goal operations with infinite scrolling
 * Provides all goal-related queries and mutations with infinite query support
 */
export function useGoalOperationsInfinite(limit: number = 10, canCheckIn?: boolean) {
  const goalsQuery = useInfiniteGoals({ limit, canCheckIn })
  const currentGoalQuery = useCurrentGoal()
  const createGoalMutation = useCreateGoal()
  const checkInMutation = useCheckIn()
  const resetGoalMutation = useResetGoal()
  const updateGoalMutation = useUpdateGoal()
  const deleteGoalMutation = useDeleteGoal()

  // Flatten pages for easier consumption
  const goals = goalsQuery.data?.pages.flatMap(page => page.data) || []
  const lastPage = goalsQuery.data?.pages[goalsQuery.data.pages.length - 1]

  return {
    // Queries
    goals,
    pagination: lastPage?.pagination,
    currentGoal: currentGoalQuery.data,
    isLoading: goalsQuery.isLoading || currentGoalQuery.isLoading,
    isFetching: goalsQuery.isFetching || currentGoalQuery.isFetching,
    isFetchingNextPage: goalsQuery.isFetchingNextPage,
    hasNextPage: goalsQuery.hasNextPage,
    fetchNextPage: goalsQuery.fetchNextPage,
    error: goalsQuery.error || currentGoalQuery.error,

    // Mutations
    createGoal: createGoalMutation.mutate,
    createGoalAsync: createGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,

    checkIn: (
      goalId?: string,
      notes?: string,
      attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
    ) => checkInMutation.mutate({ goalId, notes, attachments }),
    checkInAsync: (
      goalId?: string,
      notes?: string,
      attachments?: Array<{ type: 'image' | 'audio'; url: string; publicId?: string; name?: string }>
    ) => checkInMutation.mutateAsync({ goalId, notes, attachments }),
    isCheckingIn: checkInMutation.isPending,

    resetGoal: resetGoalMutation.mutate,
    resetGoalAsync: resetGoalMutation.mutateAsync,
    isResetting: resetGoalMutation.isPending,

    updateGoal: (goalId: string, data: UpdateGoalRequest) => updateGoalMutation.mutate({ goalId, data }),
    updateGoalAsync: (goalId: string, data: UpdateGoalRequest) => updateGoalMutation.mutateAsync({ goalId, data }),
    isUpdating: updateGoalMutation.isPending,

    deleteGoal: deleteGoalMutation.mutate,
    deleteGoalAsync: deleteGoalMutation.mutateAsync,
    isDeleting: deleteGoalMutation.isPending,

    // Refetch functions
    refetchGoals: goalsQuery.refetch,
    refetchCurrentGoal: currentGoalQuery.refetch,
  }
}
