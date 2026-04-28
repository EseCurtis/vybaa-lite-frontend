/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Toggle features on/off by setting the corresponding flag to true/false.
 * 
 * Usage:
 *   import { featureFlags } from '@/shared/config/feature-flags.config'
 *   
 *   if (featureFlags.journal) {
 *     // Journal feature code
 *   }
 */

export interface FeatureFlags {
  /**
   * Journal feature - allows users to create and manage journal entries
   * Routes: /journal, /journal/$date
   */
  journal: boolean

  /**
   * Chill feature - breathing exercises and emotion regulation
   * Routes: /chill, /chill/timer/$sessionId/$duration
   */
  chill: boolean

  /**
   * Insights feature - analytics and insights about user progress
   * Routes: /app/insights, /app/sub-profile/insights
   */
  insights: boolean
}

/**
 * Feature flags configuration
 * 
 * Set to true to enable a feature, false to disable it.
 * When disabled, routes and UI elements related to that feature will be hidden.
 */
export const featureFlags: FeatureFlags = {
  journal: false,
  chill: false,
  insights: true,
}

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature] ?? false
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): Array<keyof FeatureFlags> {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature as keyof FeatureFlags)
}

/**
 * Get all disabled features
 */
export function getDisabledFeatures(): Array<keyof FeatureFlags> {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => !enabled)
    .map(([feature]) => feature as keyof FeatureFlags)
}
