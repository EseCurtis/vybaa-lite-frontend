import ConfirmAccountScreen from '@/app/auth/confirm-account.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/confirm')({
  component: ConfirmAccountScreen,
})

