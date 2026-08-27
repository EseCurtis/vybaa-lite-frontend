import type { SubscriptionStatus } from '@/shared/api/subscription.api'

export type SubscriptionDisplayState = 'active' | 'expired' | 'free' | 'trial'

export function getSubscriptionDisplayState(
  status: SubscriptionStatus | null,
  hasActiveSdkEntitlement = false,
): SubscriptionDisplayState {
  if (status?.isTrial && status.isPro) return 'trial'
  if (isSubscriptionActive(status, hasActiveSdkEntitlement)) return 'active'
  if (status?.productIdentifier || status?.expiresAt) return 'expired'
  return 'free'
}

export function getSubscriptionDisplayLabel(
  status: SubscriptionStatus | null,
  hasActiveSdkEntitlement = false,
): string {
  const state = getSubscriptionDisplayState(status, hasActiveSdkEntitlement)
  if (state === 'trial') return 'Trial active'
  if (state === 'active') return 'Active'
  if (state === 'expired') return 'Expired'
  return 'Free plan'
}

export function isSubscriptionActive(
  status: Pick<SubscriptionStatus, 'isPro'> | null,
  hasActiveSdkEntitlement: boolean,
): boolean {
  return hasActiveSdkEntitlement || Boolean(status?.isPro)
}
