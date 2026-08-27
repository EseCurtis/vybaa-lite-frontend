import type { CustomerInfo } from '@revenuecat/purchases-capacitor'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useAuth } from '@/providers/auth.provider'
import {
  addRevenueCatCustomerInfoListener,
  configureRevenueCat,
  getRevenueCatConfigurationErrorForCurrentBuild,
  isRevenueCatSupported,
  isVybaaProCustomer,
  presentVybaaCustomerCenter,
  presentVybaaProPaywall,
  removeRevenueCatCustomerInfoListener,
  type PaywallOutcome,
} from '@/services/revenuecat.service'
import {
  subscriptionAPI,
  type SubscriptionStatus,
} from '@/shared/api/subscription.api'
import { communityQueryKeys } from '@/shared/api/community.query-keys'
import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { subscriptionQueryKeys } from '@/shared/api/subscription.query-keys'
import { isSubscriptionActive } from '@/shared/subscription/subscription.util'

interface SubscriptionContextValue {
  customerInfo: CustomerInfo | null
  error: string | null
  expiresAt: string | null
  isLoading: boolean
  isPro: boolean
  isSupported: boolean
  isTrial: boolean
  openCustomerCenter: () => Promise<void>
  presentPaywall: () => Promise<PaywallOutcome>
  productIdentifier: string | null
  refresh: () => Promise<void>
  status: SubscriptionStatus | null
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null)

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode
}): React.JSX.Element {
  const { isAuthenticated, user } = useAuth()
  const queryClient = useQueryClient()
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [sdkError, setSdkError] = useState<string | null>(null)
  const [isSdkLoading, setIsSdkLoading] = useState(false)
  const paywallPromiseRef = useRef<Promise<PaywallOutcome> | null>(null)
  const isSupported = isRevenueCatSupported()

  const statusQuery = useQuery({
    enabled: isSupported && isAuthenticated && Boolean(user),
    queryFn: () => subscriptionAPI.getStatus(),
    queryKey: subscriptionQueryKeys.status(),
    retry: 1,
    staleTime: 30_000,
  })

  const syncBackend = useCallback(async (): Promise<SubscriptionStatus> => {
    const status = await subscriptionAPI.sync()
    queryClient.setQueryData(subscriptionQueryKeys.status(), status)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: goalQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ['rewind'] }),
    ])
    return status
  }, [queryClient])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCustomerInfo(null)
      setSdkError(null)
      queryClient.removeQueries({ queryKey: subscriptionQueryKeys.all })
      return
    }

    if (!isSupported) return

    const activeUser = user
    let cancelled = false
    let listenerId: string | null = null

    async function initialize(): Promise<void> {
      try {
        setIsSdkLoading(true)
        setSdkError(null)
        const info = await configureRevenueCat(activeUser)
        if (cancelled) return
        setCustomerInfo(info)
        listenerId = await addRevenueCatCustomerInfoListener((updatedInfo) => {
          if (cancelled) return
          setCustomerInfo(updatedInfo)
          void syncBackend()
            .then(() => {
              if (!cancelled) setSdkError(null)
            })
            .catch((error: unknown) => {
              if (cancelled) return
              setSdkError(
                error instanceof Error
                  ? error.message
                  : 'Subscription status could not be refreshed',
              )
            })
        })
        void syncBackend()
          .then(() => {
            if (!cancelled) setSdkError(null)
          })
          .catch((error: unknown) => {
            if (cancelled) return
            setSdkError(
              error instanceof Error
                ? error.message
                : 'Subscription status could not be refreshed',
            )
          })
      } catch (error: unknown) {
        if (cancelled) return
        setSdkError(
          error instanceof Error
            ? error.message
            : 'Subscriptions could not be initialized',
        )
      } finally {
        if (!cancelled) setIsSdkLoading(false)
      }
    }

    void initialize()

    return () => {
      cancelled = true
      if (listenerId) void removeRevenueCatCustomerInfoListener(listenerId)
    }
  }, [isAuthenticated, isSupported, queryClient, syncBackend, user])

  const refresh = useCallback(async (): Promise<void> => {
    if (!isSupported || !user) return

    const info = await configureRevenueCat(user)
    setCustomerInfo(info)
    await syncBackend()
  }, [isSupported, syncBackend, user])

  const presentPaywall = useCallback(async (): Promise<PaywallOutcome> => {
    if (paywallPromiseRef.current) return paywallPromiseRef.current
    if (!isSupported || !user) {
      throw new Error(
        getRevenueCatConfigurationErrorForCurrentBuild() ??
          'Subscriptions are unavailable for this account',
      )
    }

    const paywallPromise = (async (): Promise<PaywallOutcome> => {
      await configureRevenueCat(user)
      const outcome = await presentVybaaProPaywall()
      if (
        outcome === 'purchased' ||
        outcome === 'restored' ||
        outcome === 'not_presented'
      ) {
        const info = await configureRevenueCat(user)
        setCustomerInfo(info)
        await syncBackend()
      }
      return outcome
    })().finally(() => {
      paywallPromiseRef.current = null
    })

    paywallPromiseRef.current = paywallPromise
    return paywallPromise
  }, [isSupported, syncBackend, user])

  const openCustomerCenter = useCallback(async (): Promise<void> => {
    if (!isSupported || !user) {
      throw new Error(
        getRevenueCatConfigurationErrorForCurrentBuild() ??
          'Subscription management is unavailable for this account',
      )
    }
    await configureRevenueCat(user)
    await presentVybaaCustomerCenter()
    const info = await configureRevenueCat(user)
    setCustomerInfo(info)
    await syncBackend()
  }, [isSupported, syncBackend, user])

  const status = statusQuery.data ?? null
  const hasActiveSdkEntitlement = isVybaaProCustomer(customerInfo)
  const value = useMemo<SubscriptionContextValue>(
    () => ({
      customerInfo,
      error: sdkError ?? statusQuery.error?.message ?? null,
      expiresAt: status?.expiresAt ?? null,
      isLoading: isSdkLoading || statusQuery.isLoading,
      isPro: isSubscriptionActive(status, hasActiveSdkEntitlement),
      isSupported,
      isTrial: status?.isTrial ?? false,
      openCustomerCenter,
      presentPaywall,
      productIdentifier: status?.productIdentifier ?? null,
      refresh,
      status,
    }),
    [
      customerInfo,
      hasActiveSdkEntitlement,
      isSdkLoading,
      isSupported,
      openCustomerCenter,
      presentPaywall,
      refresh,
      sdkError,
      status,
      statusQuery.error?.message,
      statusQuery.isLoading,
    ],
  )

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('SubscriptionProvider is missing in the component tree')
  }
  return context
}
