import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useCallback, type ReactElement } from 'react'

import RewindChatScreen from '@/app/(app)/rewind/rewind-chat.screen'
import { EdgeSwipeBack } from '@/components/common/edge-swipe-back.component'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { RewindChatProGate } from '@/components/custom/subscription/pro-feature-gate.component'
import { navigateBackWithinApp } from '@/shared/utils/app-navigation.util'

function RewindChatRoute(): ReactElement {
  const { chatId } = Route.useParams()
  const router = useRouter()
  const handleSwipeBack = useCallback((): void => {
    void navigateBackWithinApp(
      router,
      `/app/rewind-chat/${chatId}`,
      '/app/rewind-chats',
    )
  }, [chatId, router])

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
