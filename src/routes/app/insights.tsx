import InsightsScreen from '@/app/(app)/profile/insights.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/insights')({
  component: InsightsScreen,
})
