import { createFileRoute } from '@tanstack/react-router'
import InsightsScreen from '@/app/(app)/insights.screen'

export const Route = createFileRoute('/app/insights')({
  component: InsightsScreen,
})
