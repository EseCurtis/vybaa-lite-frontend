export type DeepLinkRouteName =
  | 'achievements'
  | 'communities'
  | 'goal'
  | 'home'
  | 'invite'
  | 'profile'
  | 'rewind'
  | 'rewindHistory'
  | 'rewards'

export type DeepLinkTarget = {
  code?: string
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

function getTargetFromPath(pathname: string): DeepLinkTarget | null {
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

  return allowedAppPaths[pathname] ?? null
}

export function normalizeDeepLink(input: string): DeepLinkTarget | null {
  const url = getUrlFromInput(input)

  if (!url) {
    return null
  }

  if (url.protocol === 'vybaa:') {
    const schemePath = url.hostname
      ? `/${url.hostname}${url.pathname}`
      : url.pathname
    return getTargetFromPath(schemePath)
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return null
  }

  if (url.hostname !== 'vybaa.app' && url.hostname !== 'www.vybaa.app') {
    return null
  }

  return getTargetFromPath(url.pathname)
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
