import JournalEditorScreen from '@/app/(app)/journal/$date.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/journal/$date')({
  component: JournalEditorScreen,
})
