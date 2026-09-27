import type { AnyRouter } from '@tanstack/react-router'

export const APP_TAB_ROOTS = [
  '/app/home',
  '/app/goal',
  '/app/communities',
  '/app/journal',
  '/app/wellness',
  '/app/profile',
] as const

export type AppTabRoot = (typeof APP_TAB_ROOTS)[number]

function getCommunityParent(pathname: string): string | null {
  const communitySectionMatch = pathname.match(
    /^\/app\/community\/(?:activity|goals|members)\/([^/]+)$/,
  )
  if (communitySectionMatch?.[1]) {
    return `/app/community/${communitySectionMatch[1]}`
  }

  if (pathname.startsWith('/app/community/')) return '/app/communities'
  if (pathname.startsWith('/app/communities/')) return '/app/communities'
  return null
}

export function getAppTabRoot(pathname: string): AppTabRoot | null {
  for (const tabRoot of APP_TAB_ROOTS) {
    if (pathname === tabRoot || pathname.startsWith(`${tabRoot}/`)) {
      return tabRoot
    }
  }

  if (
    pathname.startsWith('/app/community/') ||
    pathname.startsWith('/app/communities/')
  ) {
    return '/app/communities'
  }
  if (
    pathname.startsWith('/app/sub-profile/') ||
    pathname.startsWith('/app/u/')
  ) {
    return '/app/profile'
  }
  if (pathname.startsWith('/goal/')) return '/app/goal'

  return null
}

export function getAppParentPath(pathname: string): string | null {
  const communityParent = getCommunityParent(pathname)
  if (communityParent) return communityParent

  if (pathname === '/app/rewind-history-sessions') {
    return '/app/rewind-history'
  }
  if (pathname === '/app/rewind-history') return '/app/rewind'
  if (pathname === '/app/rewind-observations') return '/app/rewind'
  if (pathname.startsWith('/app/rewind-chat/')) return '/app/rewind-chats'
  if (pathname === '/app/rewind-chats') return '/app/rewind'
  if (pathname === '/app/rewind-routine') return '/app/rewind'
  if (pathname.startsWith('/app/r/')) {
    return '/app/rewind-history-sessions'
  }
  if (pathname === '/app/rewind') return '/app/home'
  if (pathname === '/app/rewards') return '/app/profile'
  if (pathname.startsWith('/app/journal/')) return '/app/journal'
  if (pathname.startsWith('/app/journal-preview/')) return '/app/journal'
  if (pathname === '/app/actions/flexx') return '/app/home'
  if (pathname === '/notifications') return '/app/home'
  if (pathname === '/achievements') return '/app/profile'
  if (pathname.startsWith('/app/sub-profile/')) return '/app/profile'
  if (pathname.startsWith('/app/u/')) return '/app/profile'
  if (pathname.startsWith('/goal/')) return '/app/goal'
  if (pathname.startsWith('/journal/')) return '/app/journal'
  if (pathname === '/journal') return '/app/journal'

  return null
}

export async function navigateBackWithinApp(
  router: AnyRouter,
  pathname: string,
): Promise<boolean> {
  const parentPath = getAppParentPath(pathname)
  if (parentPath) {
    await router.navigate({ replace: true, to: parentPath })
    return true
  }

  const tabRoot = getAppTabRoot(pathname)
  if (tabRoot && tabRoot !== '/app/home') {
    await router.navigate({ replace: true, to: '/app/home' })
    return true
  }

  return false
}
