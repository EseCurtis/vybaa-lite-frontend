import SignupScreen from '@/app/auth/signup.screen'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/signup')({
  component: SignupScreen,
})

