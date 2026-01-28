/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { taskAPI } from '@/shared/api/task.api'
import { homeStatsKeys } from '@/hooks/use-home-stats.hook'
import type { CreateTaskRequest, UpdateTaskRequest } from '@/shared/types/auth.types'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: string) => [...taskKeys.lists(), { filters }] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  infinite: () => [...taskKeys.all, 'infinite'] as const,
}

export const useTasks = () => {
  return useQuery({
    queryKey: taskKeys.lists(),
    queryFn: () => taskAPI.getTasks(),
    staleTime: 5 * 60 * 1000,
  })
}

export const useTasksInfinite = (limit = 10, status: 'ALL' | 'COMPLETED' | 'SKIPPED' = 'ALL') => {
  return useInfiniteQuery({
    queryKey: [...taskKeys.infinite(), { status, limit }],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => taskAPI.getTasksPage(pageParam, limit, { status, sort: 'created_desc' }),
    getNextPageParam: (lastPage) => {

      console.log("JACKIE=>", lastPage)
      return lastPage?.data?.meta?.hasNext ? (lastPage?.data?.meta?.page || 1) + 1 : undefined
    },
    staleTime: 60 * 1000,
    refetchOnMount: false
  })
}

export const useCreateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskAPI.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.infinite() })
      queryClient.invalidateQueries({ queryKey: homeStatsKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}

export const useUpdateTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequest }) =>
      taskAPI.updateTask(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.infinite() })
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: homeStatsKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}

export const useDeleteTask = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskId: string) => taskAPI.deleteTask(taskId),
    onSuccess: (_res, taskId) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.infinite() })
      if (taskId) queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      queryClient.invalidateQueries({ queryKey: homeStatsKeys.stats() })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}

export const useTask = (taskId?: string) => {
  return useQuery({
    queryKey: taskKeys.detail(taskId!),
    queryFn: taskId ? () => taskAPI.getTaskById(taskId) : undefined,
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000
  })
}
