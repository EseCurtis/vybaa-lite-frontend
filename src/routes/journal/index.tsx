import JournalListScreen from '@/app/(app)/journal/index.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/')({
  component: JournalListScreen,
})
