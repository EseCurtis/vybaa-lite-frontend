import ForgotPasswordScreen from '@/app/auth/forgot-password.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPasswordScreen,
})

