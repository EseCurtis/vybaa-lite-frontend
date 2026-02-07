import AchievementsScreen from '@/app/(app)/achievements.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/achievements')({
  component: AchievementsScreen,
})
