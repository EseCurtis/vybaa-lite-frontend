import { App } from '@capacitor/app'
import type { AnyRouter } from '@tanstack/react-router'
import { useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { useAuth } from '@/providers/auth.provider'
import {
  consumePendingDeepLink,
  type DeepLinkTarget,
  normalizeDeepLink,
  storePendingDeepLink,
} from '@/shared/utils/deep-link.util'

import ConfigCapacitorApp from './config'
import { setQueryClientForNotifications } from './plugins/push-notification.plugin'

type CapacitorPluginProps = {
  router: AnyRouter
}

async function navigateToDeepLink(
  router: AnyRouter,
  target: DeepLinkTarget,
): Promise<void> {
  if (target.route === 'invite' && target.code) {
    await router.navigate({
      params: { code: target.code },
      replace: true,
      to: '/app/invite/$code',
    })
    return
  }

  await router.navigate({
    replace: true,
    to: target.path,
  })
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
        await router.navigate({ replace: true, to: '/' })
        return
      }

      await navigateToDeepLink(router, target)
    },
    [isAuthenticated, router],
  )

  useEffect(() => {
    setQueryClientForNotifications(queryClient)

    const configure = async (): Promise<void> => {
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
      void navigateToDeepLink(router, target)
    }
  }, [isAuthenticated, isLoading, router])

  return null
}
