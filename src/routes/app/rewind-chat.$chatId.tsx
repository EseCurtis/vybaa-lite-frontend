import { createFileRoute } from '@tanstack/react-router'
import type { ReactElement } from 'react'

import RewindChatScreen from '@/app/(app)/rewind/rewind-chat.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'

function RewindChatRoute(): ReactElement {
  const { chatId } = Route.useParams()
  return (
    <ProtectedRoute redirectTo="/" requireAuth>
      <RewindChatScreen chatId={chatId} key={chatId} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/rewind-chat/$chatId')({
  component: RewindChatRoute,
})
