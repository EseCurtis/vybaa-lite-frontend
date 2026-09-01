import GoalDetailScreen from '@/app/(goal)/detail.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/goal/$goalId')({
  component: GoalDetailScreen,
})
