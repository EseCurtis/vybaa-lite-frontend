import type { SubscriptionStatus } from '@/shared/api/subscription.api'

export type SubscriptionDisplayState =
  | 'active'
  | 'expired'
  | 'free'
  | 'trial'

export function getSubscriptionDisplayState(
  status: SubscriptionStatus | null,
): SubscriptionDisplayState {
  if (status?.isTrial && status.isPro) return 'trial'
  if (status?.isPro) return 'active'
  if (status?.productIdentifier || status?.expiresAt) return 'expired'
  return 'free'
}

export function getSubscriptionDisplayLabel(
  status: SubscriptionStatus | null,
): string {
  const state = getSubscriptionDisplayState(status)
  if (state === 'trial') return 'Trial active'
  if (state === 'active') return 'Active'
  if (state === 'expired') return 'Expired'
  return 'Free plan'
}
