import RewindHistoryScreen from '@/app/(app)/rewind/rewind-history.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/rewind-history')({
  component: RewindHistoryScreen,
})
