import GoalsAppScreen from '@/app/(goal)/index.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/goal/')({
  component: GoalsAppScreen,
})
