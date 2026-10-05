import { Capacitor } from '@capacitor/core'
import type { AnyRouter } from '@tanstack/react-router'

import {
  countGrantedOnboardingPermissions,
  readOnboardingPermissionStates,
} from '@/shared/permissions/device-permission-state.util'
import {
  hasSeenPermissionOnboarding,
  markPermissionOnboardingSeen,
  markRewindPartnerOnboardingSeen,
  shouldShowPermissionOnboarding,
  shouldShowRewindPartnerOnboarding,
} from '@/shared/permissions/permission-onboarding.util'
import type { AuthUser } from '@/shared/types/auth.types'
import type { DeepLinkTarget } from '@/shared/utils/deep-link.util'
import { consumePendingDeepLink } from '@/shared/utils/deep-link.util'

export interface DeepLinkNavigationOptions {
  replace?: boolean
}

export async function navigateToDeepLinkTarget(
  router: AnyRouter,
  target: DeepLinkTarget,
  options: DeepLinkNavigationOptions = {},
): Promise<void> {
  const replace = options.replace ?? true

  if (target.route === 'invite' && target.code) {
    await router.navigate({
      params: { code: target.code },
      replace,
      to: '/app/invite/$code',
    })
    return
  }

  if (target.route === 'rewindSession' && target.sessionId) {
    await router.navigate({
      params: { sessionId: target.sessionId },
      replace,
      search: { from: 'insights' },
      to: '/app/r/$sessionId',
    })
    return
  }

  if (target.route === 'rewindChat' && target.chatId) {
    const chatId = target.chatId
    if (chatId) {
      await router.navigate({
        params: { chatId },
        replace,
        to: '/app/rewind-chat/$chatId',
      })
      return
    }
  }

  if (target.route === 'community' && target.communityId) {
    await router.navigate({
      hash: target.hash ?? '',
      params: { communityId: target.communityId },
      replace,
      to: '/app/community/$communityId',
    })
    return
  }

  if (target.route === 'goal') {
    await router.navigate({
      replace,
      search: target.goalId ? { goalId: target.goalId } : {},
      to: '/app/goal',
    })
    return
  }

  await router.navigate({
    replace,
    to: target.path,
  })
}

export type RequiredOnboardingRoute =
  | '/app/onboarding/rewind-partner'
  | '/app/permissions'

export async function getRequiredOnboardingRoute(
  user: Pick<AuthUser, 'id' | 'rewindPersona'>,
): Promise<RequiredOnboardingRoute | null> {
  if (Capacitor.isNativePlatform() && !hasSeenPermissionOnboarding(user.id)) {
    const permissionStates = await readOnboardingPermissionStates()
    const grantedPermissionCount =
      countGrantedOnboardingPermissions(permissionStates)

    if (shouldShowPermissionOnboarding(user.id, grantedPermissionCount)) {
      return '/app/permissions'
    }
  }

  markPermissionOnboardingSeen(user.id)

  if (shouldShowRewindPartnerOnboarding(user.id, user.rewindPersona)) {
    return '/app/onboarding/rewind-partner'
  }

  if (user.rewindPersona) {
    markRewindPartnerOnboardingSeen(user.id)
  }

  return null
}

export async function navigateAfterAuth(
  router: AnyRouter,
  user: Pick<AuthUser, 'id' | 'rewindPersona'>,
): Promise<void> {
  const onboardingRoute = await getRequiredOnboardingRoute(user)
  if (onboardingRoute) {
    await router.navigate({ replace: true, to: onboardingRoute })
    return
  }

  const target = consumePendingDeepLink()

  if (target) {
    // Establish the authenticated app entry before opening a deep link. This
    // keeps Back meaningful after a cold-start notification or app link.
    await router.navigate({ replace: true, to: '/app/home' })
    await navigateToDeepLinkTarget(router, target, { replace: false })
    return
  }

  await router.navigate({ replace: true, to: '/app/home' })
}
