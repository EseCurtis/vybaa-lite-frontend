import { PublicProfileView } from '@/app/(app)/profile/public-profile.screen'
import AppScreen from '@/app/index.screen'
import { getPublicProfileUsernameFromHost } from '@/shared/config/public-urls.config'
import { createFileRoute } from '@tanstack/react-router'

function IndexScreen() {
  const publicProfileUsername = getPublicProfileUsernameFromHost(
    typeof window === 'undefined' ? undefined : window.location.hostname,
  )

  if (publicProfileUsername) {
    return <PublicProfileView isStandalone username={publicProfileUsername} />
  }

  return <AppScreen />
}

export const Route = createFileRoute('/')({
  component: IndexScreen,
})
