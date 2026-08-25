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

export type RevenueCatEnvironment = 'development' | 'production' | 'staging'
export type RevenueCatPlatform = 'android' | 'ios' | 'web'

export interface RevenueCatApiKeys {
  android: string
  ios: string
  test?: string
}

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

export function getRevenueCatApiKeyForPlatform(
  platform: RevenueCatPlatform,
  apiKeys: RevenueCatApiKeys,
  environment: RevenueCatEnvironment = 'production',
): string {
  const testApiKey = apiKeys.test?.trim() ?? ''
  if (environment !== 'production' && testApiKey) return testApiKey
  if (platform === 'ios') return apiKeys.ios.trim()
  if (platform === 'android') return apiKeys.android.trim()
  return ''
}

export function getRevenueCatConfigurationError(
  platform: RevenueCatPlatform,
  apiKey: string,
  environment: RevenueCatEnvironment,
): string | null {
  if (platform === 'web') {
    return 'Subscriptions are available in the Android and iOS apps'
  }

  const platformName = platform === 'android' ? 'Android' : 'iOS'
  const normalizedApiKey = apiKey.trim()
  if (!normalizedApiKey) {
    return `RevenueCat is not configured for this ${platformName} build`
  }

  if (normalizedApiKey.startsWith('test_')) {
    return environment === 'production'
      ? 'A RevenueCat Test Store key cannot be used in a production build'
      : null
  }

  const expectedPrefix = platform === 'android' ? 'goog_' : 'appl_'
  if (!normalizedApiKey.startsWith(expectedPrefix)) {
    return `The RevenueCat key does not belong to the ${platformName} app`
  }

  return null
}

function getRevenueCatApiKey(): string {
  return getRevenueCatApiKeyForPlatform(
    ENV.PLATFORM,
    {
      android: ENV.REVENUECAT_ANDROID_API_KEY,
      ios: ENV.REVENUECAT_IOS_API_KEY,
      test: ENV.REVENUECAT_TEST_API_KEY,
    },
    ENV.ENVIRONMENT,
  )
}

export function getRevenueCatConfigurationErrorForCurrentBuild():
  | string
  | null {
  return getRevenueCatConfigurationError(
    ENV.PLATFORM,
    getRevenueCatApiKey(),
    ENV.ENVIRONMENT,
  )
}

export function isRevenueCatPlatformEnabled(
  platform: RevenueCatPlatform,
): boolean {
  return platform === 'android'
}

export function isRevenueCatSupported(): boolean {
  return (
    isRevenueCatPlatformEnabled(ENV.PLATFORM) &&
    Capacitor.isNativePlatform() &&
    getRevenueCatConfigurationErrorForCurrentBuild() === null
  )
}

export function isVybaaProCustomer(customerInfo: CustomerInfo | null): boolean {
  return Boolean(
    customerInfo?.entitlements.active[VYBAA_PRO_ENTITLEMENT_ID]?.isActive,
  )
}

export async function configureRevenueCat(user: User): Promise<CustomerInfo> {
  const configurationError = getRevenueCatConfigurationErrorForCurrentBuild()
  if (configurationError) throw new Error(configurationError)

  const apiKey = getRevenueCatApiKey()

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
