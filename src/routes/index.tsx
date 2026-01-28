import AppScreen from '@/app/index.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: AppScreen,
})
