import { describe, expect, it } from 'vitest'

import {
  getUnauthenticatedDeepLinkEntryPath,
  normalizeDeepLink,
} from './deep-link.util'

describe('normalizeDeepLink', () => {
  it('normalizes invite links from web and native schemes', () => {
    expect(normalizeDeepLink('https://vybaa.app/invite/ab12cd')).toEqual({
      code: 'AB12CD',
      path: '/app/invite/AB12CD',
      requiresAuth: true,
      route: 'invite',
    })

    expect(normalizeDeepLink('vybaa://invite/xy987z')).toEqual({
      code: 'XY987Z',
      path: '/app/invite/XY987Z',
      requiresAuth: true,
      route: 'invite',
    })
  })

  it('allows known app routes and rejects unsafe hosts', () => {
    expect(normalizeDeepLink('https://vybaa.app/app/profile')).toEqual({
      path: '/app/profile',
      requiresAuth: true,
      route: 'profile',
    })

    expect(normalizeDeepLink('https://example.com/app/profile')).toBeNull()
  })

  it('opens a completed Rewind directly from a notification route', () => {
    expect(normalizeDeepLink('https://vybaa.app/app/r/rewind_123')).toEqual({
      path: '/app/r/rewind_123',
      requiresAuth: true,
      route: 'rewindSession',
      sessionId: 'rewind_123',
    })
  })

  it('preserves a supported community tab from a notification route', () => {
    expect(
      normalizeDeepLink(
        'https://vybaa.app/app/community/community_123#activity',
      ),
    ).toEqual({
      communityId: 'community_123',
      hash: 'activity',
      path: '/app/community/community_123',
      requiresAuth: true,
      route: 'community',
    })
  })

  it('sends signed-out invite links to signup before resuming', () => {
    const target = normalizeDeepLink('https://vybaa.app/invite/ab12cd')

    expect(target).not.toBeNull()
    expect(getUnauthenticatedDeepLinkEntryPath(target!)).toBe('/auth/signup')
  })
})
