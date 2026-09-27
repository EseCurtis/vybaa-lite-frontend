import type {
  AppleAuthStatus,
  GoogleAuthStatus,
} from '@/shared/types/auth.types'

export function getAppleAuthStatusText(status: AppleAuthStatus): string | null {
  if (status === 'idle') {
    return null
  }

  if (status === 'preparing') {
    return 'Preparing Apple sign-in...'
  }

  if (status === 'opening-apple') {
    return 'Opening Apple sign-in...'
  }

  if (status === 'verifying-apple') {
    return 'Verifying your Apple account...'
  }

  return 'Creating your secure session...'
}

export function getGoogleAuthStatusText(
  status: GoogleAuthStatus,
): string | null {
  if (status === 'idle') {
    return null
  }

  if (status === 'preparing') {
    return 'Preparing Google sign-in...'
  }

  if (status === 'opening-google') {
    return 'Opening Google account picker...'
  }

  if (status === 'verifying-google') {
    return 'Verifying your Google account...'
  }

  return 'Creating your secure session...'
}
