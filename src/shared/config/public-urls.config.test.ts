import {
  getPublicProfileUrl,
  getPublicProfileUsernameFromHost,
} from './public-urls.config'
import { describe, expect, it } from 'vitest'

describe('public profile URLs', () => {
  it('builds a canonical profile URL from a valid username', () => {
    expect(getPublicProfileUrl('Ada_Lovelace')).toBe(
      'https://ada_lovelace.vybaa.app',
    )
  })

  it('rejects invalid usernames instead of creating malformed URLs', () => {
    expect(getPublicProfileUrl('ada lovelace')).toBeNull()
  })

  it('recognizes only member profile subdomains', () => {
    expect(getPublicProfileUsernameFromHost('ada.vybaa.app')).toBe('ada')
    expect(getPublicProfileUsernameFromHost('www.vybaa.app')).toBeNull()
    expect(getPublicProfileUsernameFromHost('ada.team.vybaa.app')).toBeNull()
  })
})
