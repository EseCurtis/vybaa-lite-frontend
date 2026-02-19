import InsightsScreen from '@/app/(app)/profile/insights.screen'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/app/insights')({
  beforeLoad: () => {
    if (!featureFlags.insights) {
      throw redirect({ to: '/app/profile' })
    }
  },
  component: InsightsScreen,
})
