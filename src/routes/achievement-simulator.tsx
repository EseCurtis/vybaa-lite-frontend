import AchievementSimulatorScreen from '@/app/(app)/achievement-simulator.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/achievement-simulator')({
  component: AchievementSimulatorScreen,
})
