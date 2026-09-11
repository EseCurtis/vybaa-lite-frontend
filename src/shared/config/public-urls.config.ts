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
