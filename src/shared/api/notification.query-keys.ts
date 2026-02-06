export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (page?: number, limit?: number) => 
    [...notificationQueryKeys.lists(), { page, limit }] as const,
  unreadCount: () => [...notificationQueryKeys.all, 'unread-count'] as const,
}
