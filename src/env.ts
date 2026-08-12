import { Capacitor } from '@capacitor/core'

type AppEnvironment = 'development' | 'production' | 'staging'
type AppPlatform = 'android' | 'ios' | 'web'

interface AppEnvironmentConfig {
  API_BASE_URL: string
  ENVIRONMENT: AppEnvironment
  GOOGLE_ANDROID_CLIENT_ID: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_IOS_CLIENT_ID: string
  PLATFORM: AppPlatform
  PLATFORMS: {
    ANDROID: 'android'
    IOS: 'ios'
    WEB: 'web'
  }
  REVENUECAT_ANDROID_API_KEY: string
  REVENUECAT_IOS_API_KEY: string
  REVENUECAT_TEST_API_KEY: string
}

function getEnvironment(value: string | undefined): AppEnvironment {
  if (value === 'production' || value === 'staging') return value
  return 'development'
}

function getPlatform(value: string): AppPlatform {
  if (value === 'android' || value === 'ios') return value
  return 'web'
}

const ENV: AppEnvironmentConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENVIRONMENT: getEnvironment(import.meta.env.VITE_ENVIRONMENT),
  PLATFORM: getPlatform(Capacitor.getPlatform()),
  PLATFORMS: {
    WEB: 'web',
    IOS: 'ios',
    ANDROID: 'android',
  },
  /**
   * Google OAuth client ID used by whichever Google SDK you integrate
   * (e.g. Capacitor plugin or Google Identity Services).
   */
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  GOOGLE_IOS_CLIENT_ID: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID ?? '',
  GOOGLE_ANDROID_CLIENT_ID: import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID ?? '',
  REVENUECAT_TEST_API_KEY: import.meta.env.PROD
    ? ''
    : (import.meta.env.VITE_REVENUECAT_TEST_API_KEY ?? ''),
  REVENUECAT_IOS_API_KEY: import.meta.env.VITE_REVENUECAT_IOS_API_KEY ?? '',
  REVENUECAT_ANDROID_API_KEY:
    import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY ?? '',
}

export default ENV
