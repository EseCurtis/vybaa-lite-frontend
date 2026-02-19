import JournalListScreen from '@/app/(app)/journal/index.screen'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/')({
  beforeLoad: () => {
    if (!featureFlags.journal) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: JournalListScreen,
})
