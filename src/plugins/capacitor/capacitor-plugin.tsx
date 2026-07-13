import { App } from '@capacitor/app'
import type { AnyRouter } from '@tanstack/react-router'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/providers/auth.provider'
import {
  consumePendingDeepLink,
  getUnauthenticatedDeepLinkEntryPath,
  normalizeDeepLink,
  storePendingDeepLink,
} from '@/shared/utils/deep-link.util'
import { navigateToDeepLinkTarget } from '@/shared/utils/auth-redirect.util'

import ConfigCapacitorApp from './config'
import { setQueryClientForNotifications } from './plugins/push-notification.plugin'

type CapacitorPluginProps = {
  router: AnyRouter
}

export function CapacitorPlugin({ router }: CapacitorPluginProps) {
  const queryClient = useQueryClient()
  const { isAuthenticated, isLoading } = useAuth()

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

    const configure = async (): Promise<() => void> => {
      const appUrlOpenListener = await App.addListener('appUrlOpen', (event) => {
        void handleDeepLink(event.url)
      })
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
    }
  }, [handleDeepLink, queryClient, router])

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
