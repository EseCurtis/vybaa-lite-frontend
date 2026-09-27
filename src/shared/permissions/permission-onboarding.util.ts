import { Capacitor } from '@capacitor/core'

export const PERMISSION_ONBOARDING_SEEN_KEY =
  'vybaa:permission-onboarding-seen:v3'
export const REWIND_PARTNER_ONBOARDING_SEEN_KEY =
  'vybaa:rewind-partner-onboarding-seen:v1'

const TOTAL_ONBOARDING_PERMISSIONS = 4
const REQUIRED_MISSING_PERMISSION_COUNT = 3

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getAccountStorageKey(prefix: string, userId: string): string {
  return `${prefix}:${userId}`
}

function hasSeenAccountOnboardingStep(prefix: string, userId: string): boolean {
  const storage = getLocalStorage()
  if (!storage) return true

  try {
    return storage.getItem(getAccountStorageKey(prefix, userId)) === 'true'
  } catch {
    return true
  }
}

function markAccountOnboardingStep(prefix: string, userId: string): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    storage.setItem(getAccountStorageKey(prefix, userId), 'true')
  } catch {
    // Permission education is non-critical when device storage is unavailable.
  }
}

export function hasSeenPermissionOnboarding(userId: string): boolean {
  return hasSeenAccountOnboardingStep(PERMISSION_ONBOARDING_SEEN_KEY, userId)
}

export function markPermissionOnboardingSeen(userId: string): void {
  markAccountOnboardingStep(PERMISSION_ONBOARDING_SEEN_KEY, userId)
}

export function hasSeenRewindPartnerOnboarding(userId: string): boolean {
  return hasSeenAccountOnboardingStep(
    REWIND_PARTNER_ONBOARDING_SEEN_KEY,
    userId,
  )
}

export function markRewindPartnerOnboardingSeen(userId: string): void {
  markAccountOnboardingStep(REWIND_PARTNER_ONBOARDING_SEEN_KEY, userId)
}

export function markOnboardingSkipped(userId: string): void {
  markPermissionOnboardingSeen(userId)
  markRewindPartnerOnboardingSeen(userId)
}

export function shouldShowPermissionOnboarding(
  userId: string,
  grantedPermissionCount: number,
): boolean {
  const missingPermissionCount =
    TOTAL_ONBOARDING_PERMISSIONS - grantedPermissionCount

  return (
    Capacitor.isNativePlatform() &&
    !hasSeenPermissionOnboarding(userId) &&
    missingPermissionCount >= REQUIRED_MISSING_PERMISSION_COUNT
  )
}

export function shouldShowRewindPartnerOnboarding(
  userId: string,
  rewindPersona: string | undefined,
): boolean {
  return !rewindPersona && !hasSeenRewindPartnerOnboarding(userId)
}
