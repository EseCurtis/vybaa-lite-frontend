import { notificationAPI } from '@/shared/api/notification.api'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params?: { page?: number; limit?: number; seen?: boolean }) => [...notificationKeys.lists(), params] as const,
  infinite: (seen?: boolean) => [...notificationKeys.all, 'infinite', { seen }] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
}

export const useNotificationsInfinite = (limit = 10, seen?: boolean) => {
  return useInfiniteQuery({
    queryKey: notificationKeys.infinite(seen),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => notificationAPI.list(pageParam, limit, seen),
    getNextPageParam: (lastPage) => {
      return lastPage?.data?.meta?.hasNext ? (lastPage?.data?.meta?.page || 1) + 1 : undefined
    },
    staleTime: 30 * 1000,
  })
}

export const useUnreadNotificationsCount = () => {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const res = await notificationAPI.list(1, 1, false)
      return res.data?.meta?.total || 0
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })
}

