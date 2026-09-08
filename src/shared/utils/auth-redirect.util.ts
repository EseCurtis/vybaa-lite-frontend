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
    await navigateToDeepLinkTarget(router, target)
    return
  }

  await router.navigate({ replace: true, to: '/app/home' })
}
