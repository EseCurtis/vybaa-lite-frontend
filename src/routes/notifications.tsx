import NotificationsScreen from '@/app/(app)/notifications.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/notifications')({
  component: NotificationsScreen,
})

