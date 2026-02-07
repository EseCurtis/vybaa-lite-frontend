import ChillEmotionScreen from '@/app/(app)/chill/index.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/chill/')({
  component: ChillEmotionScreen,
})
