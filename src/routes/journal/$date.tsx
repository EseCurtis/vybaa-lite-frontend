import JournalEditorScreen from '@/app/(app)/journal/$date.screen'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/$date')({
  beforeLoad: () => {
    if (!featureFlags.journal) {
      throw redirect({ to: '/app/home' })
    }
  },
  component: JournalEditorScreen,
})
