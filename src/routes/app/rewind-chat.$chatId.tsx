import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'

import RewindChatScreen from '@/app/(app)/rewind/rewind-chat.screen'
import { EdgeSwipeBack } from '@/components/common/edge-swipe-back.component'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { RewindChatProGate } from '@/components/custom/subscription/pro-feature-gate.component'

function RewindChatRoute(): ReactElement {
  const { chatId } = Route.useParams()
  const navigate = useNavigate()
  const handleSwipeBack = useCallback((): void => {
    void navigate({ replace: true, to: '/app/rewind-chats' })
  }, [navigate])

  return (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindChatProGate>
        <EdgeSwipeBack onBack={handleSwipeBack}>
          <RewindChatScreen chatId={chatId} key={chatId} />
        </EdgeSwipeBack>
      </RewindChatProGate>
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/rewind-chat/$chatId')({
  component: RewindChatRoute,
})
