import ChillEmotionScreen from '@/app/(app)/chill/index.screen'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/chill/')({
  beforeLoad: () => {
    if (!featureFlags.chill) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: ChillEmotionScreen,
})
