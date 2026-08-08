export type DeepLinkRouteName =
  | 'achievements'
  | 'community'
  | 'communities'
  | 'flexx'
  | 'goal'
  | 'home'
  | 'invite'
  | 'profile'
  | 'rewind'
  | 'rewindHistory'
  | 'rewindHistorySessions'
  | 'rewindRoutine'
  | 'rewindSession'
  | 'rewards'

export type DeepLinkTarget = {
  code?: string
  communityId?: string
  goalId?: string
  hash?: string
  sessionId?: string
  path: string
  requiresAuth: boolean
  route: DeepLinkRouteName
}

const PENDING_DEEP_LINK_KEY = 'pendingDeepLinkTarget'
const allowedAppPaths: Record<string, DeepLinkTarget> = {
  '/achievements': {
    path: '/achievements',
    requiresAuth: true,
    route: 'achievements',
  },
  '/app/communities': {
    path: '/app/communities',
    requiresAuth: true,
    route: 'communities',
  },
  '/app/goal': {
    path: '/app/goal',
    requiresAuth: true,
    route: 'goal',
  },
  '/app/actions/flexx': {
    path: '/app/actions/flexx',
    requiresAuth: true,
    route: 'flexx',
  },
  '/app/home': {
    path: '/app/home',
    requiresAuth: true,
    route: 'home',
  },
  '/app/profile': {
    path: '/app/profile',
    requiresAuth: true,
    route: 'profile',
  },
  '/app/rewards': {
    path: '/app/rewards',
    requiresAuth: true,
    route: 'rewards',
  },
  '/app/rewind': {
    path: '/app/rewind',
    requiresAuth: true,
    route: 'rewind',
  },
  '/app/rewind-history': {
    path: '/app/rewind-history',
    requiresAuth: true,
    route: 'rewindHistory',
  },
  '/app/rewind-history-sessions': {
    path: '/app/rewind-history-sessions',
    requiresAuth: true,
    route: 'rewindHistorySessions',
  },
  '/app/rewind-routine': {
    path: '/app/rewind-routine',
    requiresAuth: true,
    route: 'rewindRoutine',
  },
}

function normalizeInviteCode(code: string | undefined): string | undefined {
  const normalizedCode = code?.replace(/[^a-z0-9]/gi, '').toUpperCase()
  return normalizedCode || undefined
}

function getUrlFromInput(input: string): URL | null {
  try {
    return new URL(input)
  } catch {
    try {
      return new URL(input, 'https://vybaa.app')
    } catch {
      return null
    }
  }
}

function getCommunityHash(hash: string): string | undefined {
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  return value === 'activity' || value === 'members' || value === 'moderation'
    ? value
    : undefined
}

function normalizeGoalId(value: string | null): string | undefined {
  const goalId = value?.trim()
  if (!goalId || goalId.length > 128 || !/^[a-z0-9_-]+$/i.test(goalId)) {
    return undefined
  }
  return goalId
}

function getTargetFromPath(
  pathname: string,
  hash: string = '',
  searchParams?: URLSearchParams,
): DeepLinkTarget | null {
  const inviteMatch = pathname.match(/^\/(?:app\/)?invite\/([^/]+)$/)
  const inviteCode = normalizeInviteCode(inviteMatch?.[1])

  if (inviteCode) {
    return {
      code: inviteCode,
      path: `/app/invite/${inviteCode}`,
      requiresAuth: true,
      route: 'invite',
    }
  }

  const rewindSessionMatch = pathname.match(/^\/app\/r\/([^/]+)$/)
  const sessionId = rewindSessionMatch?.[1]?.trim()
  if (sessionId) {
    return {
      path: `/app/r/${sessionId}`,
      requiresAuth: true,
      route: 'rewindSession',
      sessionId,
    }
  }

  const communityMatch = pathname.match(/^\/app\/community\/([^/]+)$/)
  const communityId = communityMatch?.[1]?.trim()
  if (communityId) {
    return {
      communityId,
      hash: getCommunityHash(hash),
      path: `/app/community/${communityId}`,
      requiresAuth: true,
      route: 'community',
    }
  }

  if (pathname === '/app/goal') {
    const goalId = normalizeGoalId(searchParams?.get('goalId') ?? null)
    return {
      ...allowedAppPaths['/app/goal'],
      ...(goalId ? { goalId } : {}),
    }
  }

  return allowedAppPaths[pathname] ?? null
}

export function normalizeDeepLink(input: string): DeepLinkTarget | null {
  const url = getUrlFromInput(input)

  if (!url) {
    return null
  }

  if (url.protocol === 'vybaa:' || url.protocol === 'com.vybaa.app:') {
    const schemePath = url.hostname
      ? `/${url.hostname}${url.pathname}`
      : url.pathname
    return getTargetFromPath(schemePath, url.hash, url.searchParams)
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null
  }

  if (url.hostname !== 'vybaa.app' && url.hostname !== 'www.vybaa.app') {
    return null
  }

  return getTargetFromPath(url.pathname, url.hash, url.searchParams)
}

export function storePendingDeepLink(target: DeepLinkTarget): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(PENDING_DEEP_LINK_KEY, JSON.stringify(target))
}

export function getUnauthenticatedDeepLinkEntryPath(
  target: DeepLinkTarget,
): '/' | '/auth/signup' {
  return target.route === 'invite' ? '/auth/signup' : '/'
}

export function consumePendingDeepLink(): DeepLinkTarget | null {
  if (typeof window === 'undefined') {
    return null
  }

  const rawTarget = localStorage.getItem(PENDING_DEEP_LINK_KEY)
  localStorage.removeItem(PENDING_DEEP_LINK_KEY)

  if (!rawTarget) {
    return null
  }

  try {
    const parsed = JSON.parse(rawTarget) as DeepLinkTarget
    return parsed?.path && parsed?.route ? parsed : null
  } catch {
    return null
  }
}
