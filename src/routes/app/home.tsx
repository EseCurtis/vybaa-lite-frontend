import HomeAppScreen from '@/app/(app)/home.screen'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example \"home\" route for the starter app.
 *
 * This route is intentionally unauthenticated and simply renders the
 * generic `HomeAppScreen`. You can add search params or loaders here
 * later as your app grows.
 */
export const Route = createFileRoute('/app/home')({
  component: HomeAppScreen,
})
