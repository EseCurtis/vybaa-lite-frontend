import NotificationsScreen from '@/app/(app)/notifications.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/notifications')({
  component: NotificationsScreen,
})


export const Route = createFileRoute('/app/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/notifications"!</div>
}
