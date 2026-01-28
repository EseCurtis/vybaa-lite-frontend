import ProfileScreen from '@/app/(app)/profile.screen'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example profile route for the starter app.
 *
 * This is a generic screen that you can repurpose for account/profile
 * details without any built-in authentication logic.
 */
export const Route = createFileRoute('/app/profile')({
  component: ProfileScreen,
})
