import { Capacitor } from "@capacitor/core"

const ENV = {
  // Raw Vite env is still spread in for backward-compatibility with existing code.
  // We keep the cast here because Vite's runtime shape is broader than our typed surface.
  ...import.meta.env as any,
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  ENVIRONMENT: (import.meta.env.VITE_ENVIRONMENT || 'development') as
    | 'production'
    | 'development'
    | 'staging',
  PLATFORM: Capacitor.getPlatform(),
  PLATFORMS: {
    WEB: 'web',
    IOS: 'ios',
    ANDROID: 'android',
  },
  /**
   * Google OAuth client ID used by whichever Google SDK you integrate
   * (e.g. Capacitor plugin or Google Identity Services).
   */
  GOOGLE_CLIENT_ID: (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '') as string,
  GOOGLE_IOS_CLIENT_ID: (import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID ?? '') as string,
  GOOGLE_ANDROID_CLIENT_ID: (import.meta.env.VITE_GOOGLE_ANDROID_CLIENT_ID ?? '') as string,
} as {
  API_BASE_URL: string
  ENVIRONMENT: 'production' | 'development' | 'staging'
  PLATFORM: 'ios' | 'android' | 'web'
  PLATFORMS: {
    WEB: 'web'
    IOS: 'ios'
    ANDROID: 'android'
  }
  GOOGLE_CLIENT_ID: string
  GOOGLE_IOS_CLIENT_ID: string
  GOOGLE_ANDROID_CLIENT_ID: string
}

export default ENV