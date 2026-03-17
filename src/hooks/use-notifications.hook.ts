import { useToast } from '@/providers/toast.provider'
import { notificationAPI } from '@/shared/api/notification.api'
import { notificationQueryKeys } from '@/shared/api/notification.query-keys'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Hook to fetch notifications
 */
export function useNotifications(page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: notificationQueryKeys.list(page, limit),
    queryFn: async () => {
      const response = await notificationAPI.getNotifications(page, limit)
      return response
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to fetch unread count
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationQueryKeys.unreadCount(),
    queryFn: async () => {
      const response = await notificationAPI.getUnreadCount()
      return response.data.count
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  })
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient() 
   return useMutation({
    mutationFn: (notificationId: string) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() })
    },
  })
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()
  const toast = useToast()  
  return useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() })
      toast.success('All notifications marked as read')
    },
  })
}/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const toast = useToast() 
   return useMutation({
    mutationFn: (notificationId: string) => notificationAPI.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate notifications list and unread count
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.unreadCount() })
      toast.success('Notification deleted')
    },
  })
}