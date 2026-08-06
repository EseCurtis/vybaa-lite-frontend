import { Capacitor } from '@capacitor/core'
import {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  Purchases,
  type CustomerInfo,
  type CustomerInfoUpdateListener,
} from '@revenuecat/purchases-capacitor'
import {
  PAYWALL_RESULT,
  RevenueCatUI,
} from '@revenuecat/purchases-capacitor-ui'

import ENV from '@/env'
import type { User } from '@/shared/types/auth.types'

import { VYBAA_PRO_ENTITLEMENT_ID } from '@/shared/api/subscription.api'

export type PaywallOutcome =
  | 'cancelled'
  | 'error'
  | 'not_presented'
  | 'pending'
  | 'purchased'
  | 'restored'

export function getPaywallExceptionOutcome(
  error: unknown,
): Extract<PaywallOutcome, 'cancelled' | 'pending'> | null {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : null
  if (code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) return 'pending'
  if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
    return 'cancelled'
  }
  return null
}

export function mapPaywallResult(result: PAYWALL_RESULT): PaywallOutcome {
  switch (result) {
    case PAYWALL_RESULT.PURCHASED:
      return 'purchased'
    case PAYWALL_RESULT.RESTORED:
      return 'restored'
    case PAYWALL_RESULT.CANCELLED:
      return 'cancelled'
    case PAYWALL_RESULT.NOT_PRESENTED:
      return 'not_presented'
    case PAYWALL_RESULT.ERROR:
      return 'error'
  }
}

function getRevenueCatApiKey(): string {
  if (ENV.PLATFORM === ENV.PLATFORMS.IOS) {
    return ENV.REVENUECAT_IOS_API_KEY.trim()
  }
  if (ENV.PLATFORM === ENV.PLATFORMS.ANDROID) {
    return ENV.REVENUECAT_ANDROID_API_KEY.trim()
  }
  return ''
}

export function isRevenueCatSupported(): boolean {
  return Capacitor.isNativePlatform() && Boolean(getRevenueCatApiKey())
}

export function isVybaaProCustomer(customerInfo: CustomerInfo | null): boolean {
  return Boolean(
    customerInfo?.entitlements.active[VYBAA_PRO_ENTITLEMENT_ID]?.isActive,
  )
}

export async function configureRevenueCat(user: User): Promise<CustomerInfo> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Subscriptions are available in the iOS app')
  }

  const apiKey = getRevenueCatApiKey()
  if (!apiKey) {
    throw new Error('RevenueCat is not configured for this build')
  }

  if (ENV.ENVIRONMENT !== 'production') {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG })
  }

  const { isConfigured } = await Purchases.isConfigured()
  if (!isConfigured) {
    await Purchases.configure({ apiKey, appUserID: user.id })
  } else {
    const { appUserID } = await Purchases.getAppUserID()
    if (appUserID !== user.id) {
      await Purchases.logIn({ appUserID: user.id })
    }
  }

  await Promise.allSettled([
    Purchases.setEmail({ email: user.email }),
    Purchases.setDisplayName({
      displayName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username ||
        user.email,
    }),
  ])

  const { customerInfo } = await Purchases.getCustomerInfo()
  return customerInfo
}

export async function addRevenueCatCustomerInfoListener(
  listener: CustomerInfoUpdateListener,
): Promise<string> {
  return Purchases.addCustomerInfoUpdateListener(listener)
}

export async function removeRevenueCatCustomerInfoListener(
  listenerId: string,
): Promise<void> {
  await Purchases.removeCustomerInfoUpdateListener({
    listenerToRemove: listenerId,
  })
}

export async function presentVybaaProPaywall(): Promise<PaywallOutcome> {
  try {
    const { result } = await RevenueCatUI.presentPaywallIfNeeded({
      displayCloseButton: true,
      requiredEntitlementIdentifier: VYBAA_PRO_ENTITLEMENT_ID,
    })

    return mapPaywallResult(result)
  } catch (error: unknown) {
    const outcome = getPaywallExceptionOutcome(error)
    if (outcome) return outcome
    throw error
  }
}

export async function presentVybaaCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter()
}
