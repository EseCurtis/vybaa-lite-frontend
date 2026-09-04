import type { AnyRouter } from '@tanstack/react-router'

import type { DeepLinkTarget } from '@/shared/utils/deep-link.util'
import { consumePendingDeepLink } from '@/shared/utils/deep-link.util'

export async function navigateToDeepLinkTarget(
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

  if (target.route === 'rewindSession' && target.sessionId) {
    await router.navigate({
      params: { sessionId: target.sessionId },
      replace: true,
      to: '/app/r/$sessionId',
    })
    return
  }

  if (target.route === 'rewindChat' && target.chatId) {
    const chatId = target.chatId
    if (chatId) {
      await router.navigate({
        params: { chatId },
        replace: true,
        to: '/app/rewind-chat/$chatId',
      })
      return
    }
  }

  if (target.route === 'community' && target.communityId) {
    await router.navigate({
      hash: target.hash ?? '',
      params: { communityId: target.communityId },
      replace: true,
      to: '/app/community/$communityId',
    })
    return
  }

  if (target.route === 'goal') {
    await router.navigate({
      replace: true,
      search: target.goalId ? { goalId: target.goalId } : {},
      to: '/app/goal',
    })
    return
  }

  await router.navigate({
    replace: true,
    to: target.path,
  })
}

export async function navigateAfterAuth(router: AnyRouter): Promise<void> {
  const target = consumePendingDeepLink()

  if (target) {
    await navigateToDeepLinkTarget(router, target)
    return
  }

  await router.navigate({ replace: true, to: '/app/home' })
}
