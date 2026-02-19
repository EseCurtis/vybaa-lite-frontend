import ChillTimerScreen from '@/app/(app)/chill/timer.$sessionId.$duration.screen'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/chill/timer/$sessionId/$duration')({
  beforeLoad: () => {
    if (!featureFlags.chill) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: ChillTimerScreen,
})
