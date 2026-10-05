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

export type AppNavigationTransition =
  | 'vybaa-fade'
  | 'vybaa-pop'
  | 'vybaa-push'
  | 'vybaa-tab-back'
  | 'vybaa-tab-forward'
  | 'vybaa-workflow-back'
  | 'vybaa-workflow-forward'

type AppBackRouter = Pick<AnyRouter, 'navigate'> & {
  history: Pick<AnyRouter['history'], 'back' | 'canGoBack'>
}

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
  if (pathname.startsWith('/app/goal/')) return '/app/goal'
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

function isPathAncestor(ancestor: string, descendant: string): boolean {
  let currentPath: string | null = getAppParentPath(descendant)

  while (currentPath) {
    if (currentPath === ancestor) return true
    currentPath = getAppParentPath(currentPath)
  }

  return false
}

export function getAppNavigationTransition(
  fromPathname: string | undefined,
  toPathname: string,
): AppNavigationTransition {
  if (!fromPathname || fromPathname === toPathname) return 'vybaa-fade'

  if (toPathname === '/app/goal/create') return 'vybaa-workflow-forward'
  if (fromPathname === '/app/goal/create') return 'vybaa-workflow-back'

  const fromTab = getAppTabRoot(fromPathname)
  const toTab = getAppTabRoot(toPathname)

  if (fromTab && toTab && fromTab !== toTab) {
    const fromIndex = APP_TAB_ROOTS.indexOf(fromTab)
    const toIndex = APP_TAB_ROOTS.indexOf(toTab)
    return toIndex > fromIndex ? 'vybaa-tab-forward' : 'vybaa-tab-back'
  }

  if (isPathAncestor(fromPathname, toPathname)) return 'vybaa-push'
  if (isPathAncestor(toPathname, fromPathname)) return 'vybaa-pop'

  if (fromPathname === '/auth/login' && toPathname === '/auth/signup') {
    return 'vybaa-push'
  }
  if (fromPathname === '/auth/signup' && toPathname === '/auth/login') {
    return 'vybaa-pop'
  }

  return 'vybaa-fade'
}

export async function navigateBackWithinApp(
  router: AppBackRouter,
  pathname: string,
  fallbackPath?: string,
): Promise<boolean> {
  if (/^\/app\/rewind-chat\/[^/]+\/?$/.test(pathname)) {
    await router.navigate({
      replace: true,
      to: fallbackPath ?? '/app/rewind-chats',
    })
    return true
  }

  if (router.history.canGoBack()) {
    router.history.back()
    return true
  }

  if (fallbackPath) {
    await router.navigate({ replace: true, to: fallbackPath })
    return true
  }

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
