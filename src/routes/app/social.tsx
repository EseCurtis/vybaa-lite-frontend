import SocialStudioScreen from '@/app/(app)/social-studio.screen'
import { ProtectedRoute } from '@/components/common/protected-route.component'
import { createFileRoute } from '@tanstack/react-router'

type SocialStudioSearch = {
  xSocial?: 'connected' | 'failed'
}

function validateSearch(search: Record<string, unknown>): SocialStudioSearch {
  const result = search.xSocial
  return {
    xSocial: result === 'connected' || result === 'failed' ? result : undefined,
  }
}

function SocialStudioRoute() {
  const { xSocial } = Route.useSearch()
  return (
    <ProtectedRoute requireAuth redirectTo="/">
      <SocialStudioScreen oauthStatus={xSocial} />
    </ProtectedRoute>
  )
}

export const Route = createFileRoute('/app/social')({
  component: SocialStudioRoute,
  validateSearch,
})
