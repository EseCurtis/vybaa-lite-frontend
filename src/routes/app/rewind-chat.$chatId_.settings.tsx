import { createFileRoute } from '@tanstack/react-router'

import RewindChatSettingsScreen from '@/app/(app)/rewind/rewind-chat-settings.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'

function SettingsRoute() {
  const { chatId } = Route.useParams()
  return (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindChatSettingsScreen chatId={chatId} key={chatId} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/rewind-chat/$chatId_/settings')({
  component: SettingsRoute,
})
