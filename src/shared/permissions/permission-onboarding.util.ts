import { Capacitor } from '@capacitor/core'

export const PERMISSION_ONBOARDING_SEEN_KEY =
  'vybaa:permission-onboarding-seen:v1'

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function hasSeenPermissionOnboarding(): boolean {
  const storage = getLocalStorage()
  if (!storage) return true

  try {
    return storage.getItem(PERMISSION_ONBOARDING_SEEN_KEY) === 'true'
  } catch {
    return true
  }
}

export function markPermissionOnboardingSeen(): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    storage.setItem(PERMISSION_ONBOARDING_SEEN_KEY, 'true')
  } catch {
    // Permission education is non-critical when device storage is unavailable.
  }
}

export function shouldShowPermissionOnboarding(): boolean {
  return Capacitor.isNativePlatform() && !hasSeenPermissionOnboarding()
}
