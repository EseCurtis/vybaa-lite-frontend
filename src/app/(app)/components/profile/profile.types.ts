import type { ReactNode } from 'react'
import type { User } from '@/shared/types/auth.types'

export interface ProfileFormData {
  firstName: string
  lastName: string
  profileImageId: string
  username: string
}

export interface ProfileQuickAction {
  description: string
  icon: ReactNode
  iconContainerClassName?: string
  title: string
  to: '/achievements' | '/app/sub-profile/insights' | '/app/sub-profile/settings'
}

export type ProfileUser = User | null
