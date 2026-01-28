import SettingsScreen from '@/app/(app)/settings.screen'
import { createFileRoute } from '@tanstack/react-router'

/**
 * Example settings route for the starter app.
 *
 * No auth is enforced here; it's a simple place to demonstrate how
 * to build a settings/preferences screen inside the app shell.
 */
export const Route = createFileRoute('/app/settings')({
  component: SettingsScreen,
})
