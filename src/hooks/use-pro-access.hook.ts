import { useCallback } from 'react'

import { useSubscription } from '@/providers/subscription.provider'
import { useToast } from '@/providers/toast.provider'
import { isSubscriptionApiError } from '@/shared/api/http'

interface ProAccessResult {
  handleSubscriptionError: (
    error: unknown,
    retry?: () => Promise<void>,
  ) => Promise<boolean>
  requestProAccess: (retry?: () => Promise<void>) => Promise<boolean>
}

export function useProAccess(): ProAccessResult {
  const { isPro, isSupported, presentPaywall } = useSubscription()
  const toast = useToast()

  const requestProAccess = useCallback(
    async (retry?: () => Promise<void>): Promise<boolean> => {
      if (isPro) {
        if (retry) await retry()
        return true
      }

      if (!isSupported) {
        toast.info('This action is not available in this build.')
        return false
      }

      try {
        const outcome = await presentPaywall()
        if (outcome === 'cancelled') return false
        if (outcome === 'pending') {
          toast.info('Your purchase is pending approval.')
          return false
        }
        if (outcome === 'error') {
          toast.error(
            'The subscription screen could not complete your purchase.',
          )
          return false
        }

        if (retry) await retry()
        if (outcome === 'purchased' || outcome === 'restored') {
          toast.success('Vybaa Pro is ready')
        }
        return true
      } catch (error: unknown) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Vybaa Pro is unavailable right now.',
        )
        return false
      }
    },
    [isPro, isSupported, presentPaywall, toast],
  )

  const handleSubscriptionError = useCallback(
    async (error: unknown, retry?: () => Promise<void>): Promise<boolean> => {
      if (!isSubscriptionApiError(error)) return false

      if (!isSupported) {
        toast.info('This action is not available in this build.')
        return true
      }

      if (error.code === 'SUBSCRIPTION_UNAVAILABLE') {
        toast.error(error.message)
        return true
      }

      if (error.code === 'PLAN_LIMIT_REACHED') {
        toast.info(error.message)
        return true
      }

      await requestProAccess(retry)
      return true
    },
    [isSupported, requestProAccess, toast],
  )

  return { handleSubscriptionError, requestProAccess }
}
