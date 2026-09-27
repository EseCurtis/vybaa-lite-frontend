import { createFileRoute } from '@tanstack/react-router'

import RewindChatSettingsScreen from '@/app/(app)/rewind/rewind-chat-settings.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { RewindChatProGate } from '@/components/custom/subscription/pro-feature-gate.component'

function SettingsRoute() {
  const { chatId } = Route.useParams()
  return (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindChatProGate>
        <RewindChatSettingsScreen chatId={chatId} key={chatId} />
      </RewindChatProGate>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/rewind-chat/$chatId_/settings')({
  component: SettingsRoute,
})
