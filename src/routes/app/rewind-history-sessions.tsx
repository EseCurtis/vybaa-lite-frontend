import RewindSessionArchiveScreen from '@/app/(app)/rewind/rewind-session-archive.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/rewind-history-sessions')({
  component: RewindSessionArchiveScreen,
})
