import { createFileRoute } from '@tanstack/react-router'

import RewindChatsScreen from '@/app/(app)/rewind/rewind-chats.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { RewindChatProGate } from '@/components/custom/subscription/pro-feature-gate.component'

export const Route = createFileRoute('/app/rewind-chats')({
  component: () => (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindChatProGate>
        <RewindChatsScreen />
      </RewindChatProGate>
    </ProtectedRoute>
  ),
})
