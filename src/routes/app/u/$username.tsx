import PublicProfileScreen from '@/app/(app)/profile/public-profile.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/u/$username')({
  component: PublicProfileScreen,
})
