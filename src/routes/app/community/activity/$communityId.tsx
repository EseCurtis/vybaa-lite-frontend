import CommunityActivityScreen from '@/app/(app)/communities/$communityId.activity.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { featureFlags } from '@/shared/config/feature-flags.config'

export const Route = createFileRoute('/app/community/activity/$communityId')({
  beforeLoad: () => {
    if (!featureFlags.communities) throw redirect({ to: '/app/home' })
  },
  component: () => (
    <ProtectedRoute requireAuth redirectTo="/">
      <CommunityActivityScreen />
    </ProtectedRoute>
  ),
})
