import {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
} from '@revenuecat/purchases-capacitor'
import { PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui'
import { describe, expect, it } from 'vitest'

import { ApiError, isSubscriptionApiError } from '@/shared/api/http'
import type { SubscriptionStatus } from '@/shared/api/subscription.api'
import {
  getPaywallExceptionOutcome,
  isVybaaProCustomer,
  mapPaywallResult,
} from '@/services/revenuecat.service'

import {
  getSubscriptionDisplayLabel,
  getSubscriptionDisplayState,
} from './subscription.util'

function createStatus(
  overrides: Partial<SubscriptionStatus> = {},
): SubscriptionStatus {
  return {
    clientApp: 'vybaa',
    entitlementId: 'vybaa_pro',
    environment: null,
    expiresAt: null,
    isConfigured: true,
    isPro: false,
    isTrial: false,
    limits: {
      activeGoals: 3,
      insightRanges: ['7d'],
      ownedCommunities: 1,
      rewindSessionsPerDay: 1,
    },
    managementURL: null,
    productIdentifier: null,
    tier: 'free',
    usage: { activeGoals: 0, ownedCommunities: 0 },
    verifiedAt: '2026-08-06T00:00:00.000Z',
    ...overrides,
  }
}

describe('Vybaa Pro customer state', () => {
  it('requires an active vybaa_pro entitlement', () => {
    const customerInfo = {
      entitlements: {
        active: {
          vybaa_pro: { isActive: true },
        },
      },
    } as unknown as CustomerInfo

    expect(isVybaaProCustomer(customerInfo)).toBe(true)
    expect(isVybaaProCustomer(null)).toBe(false)
  })

  it('distinguishes free, trial, active, and expired states', () => {
    expect(getSubscriptionDisplayState(createStatus())).toBe('free')
    expect(
      getSubscriptionDisplayState(createStatus({ isPro: true, tier: 'pro' })),
    ).toBe('active')
    expect(
      getSubscriptionDisplayLabel(
        createStatus({ isPro: true, isTrial: true, tier: 'pro' }),
      ),
    ).toBe('Trial active')
    expect(
      getSubscriptionDisplayState(
        createStatus({
          expiresAt: '2026-08-01T00:00:00.000Z',
          productIdentifier: 'com.vybaa.app.pro.monthly',
        }),
      ),
    ).toBe('expired')
  })

  it('recognizes only machine-readable subscription API failures', () => {
    expect(
      isSubscriptionApiError(
        new ApiError('Upgrade required', { code: 'PRO_REQUIRED', status: 403 }),
      ),
    ).toBe(true)
    expect(isSubscriptionApiError(new Error('Forbidden'))).toBe(false)
  })

  it('maps every native paywall completion state', () => {
    expect(mapPaywallResult(PAYWALL_RESULT.PURCHASED)).toBe('purchased')
    expect(mapPaywallResult(PAYWALL_RESULT.RESTORED)).toBe('restored')
    expect(mapPaywallResult(PAYWALL_RESULT.CANCELLED)).toBe('cancelled')
    expect(mapPaywallResult(PAYWALL_RESULT.NOT_PRESENTED)).toBe(
      'not_presented',
    )
    expect(mapPaywallResult(PAYWALL_RESULT.ERROR)).toBe('error')
  })

  it('keeps pending and cancellation exceptions non-fatal', () => {
    expect(
      getPaywallExceptionOutcome({
        code: PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR,
      }),
    ).toBe('pending')
    expect(
      getPaywallExceptionOutcome({
        code: PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR,
      }),
    ).toBe('cancelled')
    expect(
      getPaywallExceptionOutcome({
        code: PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR,
      }),
    ).toBeNull()
  })
})
