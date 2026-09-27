import { featureFlags } from '@/shared/config/feature-flags.config'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/')({
  beforeLoad: () => {
    if (!featureFlags.journal) {
      throw redirect({ to: '/app/home' })
    }
    throw redirect({ to: '/app/journal' })
  },
})
