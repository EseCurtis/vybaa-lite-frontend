import LoginScreen from '@/app/auth/login.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/login')({
  component: LoginScreen,
})
