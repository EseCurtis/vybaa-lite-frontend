import type { User } from '@/shared/types/auth.types'
import type { ReactNode } from 'react'

export interface ProfileFormData {
  firstName: string
  lastName: string
  profileImageId: string
  username: string
}

export interface ProfileQuickAction {
  group?: 'personal' | 'preferences' | 'progress'
  description: string
  icon: ReactNode
  iconContainerClassName?: string
  colorScheme?: {
    bg1: string
    bg2: string
  }
  title: string
  to:
    | '/achievements'
    | '/app/journal'
    | '/app/onboarding/about-you'
    | '/app/rewards'
    | '/app/social'
    | '/app/sub-profile/insights'
    | '/app/sub-profile/settings'
}

export type ProfileUser = User | null
