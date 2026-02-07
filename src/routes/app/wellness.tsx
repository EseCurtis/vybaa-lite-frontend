import WellnessScreen from '@/app/(app)/wellness.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/wellness')({
  component: WellnessScreen,
})
