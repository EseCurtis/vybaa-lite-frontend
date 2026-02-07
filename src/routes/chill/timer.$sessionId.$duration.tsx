import ChillTimerScreen from '@/app/(app)/chill/timer.$sessionId.$duration.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chill/timer/$sessionId/$duration')({
  component: ChillTimerScreen,
})
