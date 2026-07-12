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
}

export type LegalDocumentType = 'privacy' | 'terms'

/**
 * Public URLs configuration
 * 
 * Update these URLs to point to your actual public pages.
 */
export const publicUrls: PublicUrls = {
  termsOfService: 'https://vybaa.app/terms-of-service',
  privacyPolicy: 'https://vybaa.app/privacy-policy',
}
