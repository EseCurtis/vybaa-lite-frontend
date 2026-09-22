/**
 * Public URLs Configuration
 *
 * Centralized configuration for public-facing URLs like terms of service,
 * privacy policy, and other legal/documentation pages.
 */

export interface PublicUrls {
  /**
   * Terms of Service URL
   */
  termsOfService: string

  /**
   * Privacy Policy URL
   */
  privacyPolicy: string
  supportEmail: string
}

export type LegalDocumentType = 'privacy' | 'terms'

/**
 * Public URLs configuration
 *
 * Update these URLs to point to your actual public pages.
 */
export const publicUrls: PublicUrls = {
  termsOfService: 'https://www.vybaa.app/terms',
  privacyPolicy: 'https://www.vybaa.app/privacy',
  supportEmail: 'vybaa.app@gmail.com',
}

export const CURRENT_TERMS_VERSION = '2026-09-11'

const PUBLIC_PROFILE_ROOT_DOMAIN = 'vybaa.app'
const reservedPublicProfileSubdomains = new Set(['api', 'app', 'cloud', 'www'])
const publicUsernamePattern = /^[a-z0-9_]{3,20}$/

function normalizePublicUsername(username: string): string | null {
  const normalizedUsername = username.trim().toLowerCase()

  if (!publicUsernamePattern.test(normalizedUsername)) {
    return null
  }

  return normalizedUsername
}

/**
 * The canonical address for a member's shareable profile. The API still
 * validates the username, so this helper is deliberately presentation-only.
 */
export function getPublicProfileUrl(username: string): string | null {
  const normalizedUsername = normalizePublicUsername(username)

  return normalizedUsername
    ? `https://${normalizedUsername}.${PUBLIC_PROFILE_ROOT_DOMAIN}`
    : null
}

/**
 * Returns the profile owner encoded in a Vybaa public-profile subdomain.
 * Reserved infrastructure hosts are never treated as member profiles.
 */
export function getPublicProfileUsernameFromHost(
  hostname: string | undefined,
): string | null {
  const normalizedHost = hostname?.trim().toLowerCase().replace(/\.$/, '')
  const domainSuffix = `.${PUBLIC_PROFILE_ROOT_DOMAIN}`

  if (!normalizedHost || !normalizedHost.endsWith(domainSuffix)) {
    return null
  }

  const username = normalizedHost.slice(0, -domainSuffix.length)

  if (
    username.includes('.') ||
    reservedPublicProfileSubdomains.has(username) ||
    !publicUsernamePattern.test(username)
  ) {
    return null
  }

  return username
}
