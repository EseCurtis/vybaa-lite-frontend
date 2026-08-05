import { App } from '@capacitor/app'
import type { AnyRouter } from '@tanstack/react-router'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { getDeviceTimezone, updateTimezone } from '@/shared/api/http'
import {
  consumePendingDeepLink,
  getUnauthenticatedDeepLinkEntryPath,
  normalizeDeepLink,
  storePendingDeepLink,
} from '@/shared/utils/deep-link.util'
import { navigateToDeepLinkTarget } from '@/shared/utils/auth-redirect.util'
import {
  claimInAppNotificationDisplay,
  formatInAppNotification,
  type InAppNotification,
} from '@/shared/notifications/in-app-notification.util'

import ConfigCapacitorApp from './config'
import {
  setForegroundPushNotificationHandler,
  setPushNotificationRouteHandler,
  setQueryClientForNotifications,
} from './plugins/push-notification.plugin'

type CapacitorPluginProps = {
  router: AnyRouter
}

export function CapacitorPlugin({ router }: CapacitorPluginProps) {
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading, refreshSession, user } = useAuth()
  const toast = useToast()

  const handleForegroundPushNotification = useCallback(
    (notification: InAppNotification): void => {
      if (!claimInAppNotificationDisplay(notification.id)) return

      toast.info(formatInAppNotification(notification))
    },
    [toast],
  )

  const syncDeviceTimezone = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) return

    const timezone = getDeviceTimezone()
    updateTimezone(timezone)
    if (timezone === user.timezone) return

    try {
      await authAPI.updateProfile({ timezone })
      await refreshSession()
    } catch {
      // A later resume or authenticated request will retry the sync.
    }
  }, [isAuthenticated, refreshSession, user])

  const handleDeepLink = useCallback(
    async (url: string): Promise<void> => {
      const target = normalizeDeepLink(url)

      if (!target) {
        return
      }

      if (target.requiresAuth && !isAuthenticated) {
        storePendingDeepLink(target)
        await router.navigate({
          replace: true,
          to: getUnauthenticatedDeepLinkEntryPath(target),
        })
        return
      }

      await navigateToDeepLinkTarget(router, target)
    },
    [isAuthenticated, router],
  )

  useEffect(() => {
    setQueryClientForNotifications(queryClient)
    setPushNotificationRouteHandler((route) => {
      void handleDeepLink(`https://vybaa.app${route}`)
    })
    setForegroundPushNotificationHandler(handleForegroundPushNotification)

    const configure = async (): Promise<() => void> => {
      const appUrlOpenListener = await App.addListener(
        'appUrlOpen',
        (event) => {
          void handleDeepLink(event.url)
        },
      )
      const launchUrl = await App.getLaunchUrl()

      if (launchUrl?.url) {
        void handleDeepLink(launchUrl.url)
      }

      ConfigCapacitorApp({
        onBack: () => {
          router.history.back()
        },
      })

      return () => {
        void appUrlOpenListener.remove()
      }
    }

    let cleanup: (() => void) | undefined
    void configure().then((nextCleanup) => {
      cleanup = nextCleanup
    })

    return () => {
      cleanup?.()
      setForegroundPushNotificationHandler(null)
      setPushNotificationRouteHandler(null)
    }
  }, [handleDeepLink, handleForegroundPushNotification, queryClient, router])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    void syncDeviceTimezone()
    let appStateListener:
      | Awaited<ReturnType<typeof App.addListener>>
      | undefined
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void syncDeviceTimezone()
      }
    }).then((listener) => {
      appStateListener = listener
    })

    return () => {
      void appStateListener?.remove()
    }
  }, [isAuthenticated, syncDeviceTimezone, user])

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return
    }

    const target = consumePendingDeepLink()
    if (target) {
      void navigateToDeepLinkTarget(router, target)
    }
  }, [isAuthenticated, isLoading, router])

  return null
}
