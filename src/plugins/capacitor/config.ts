import ENV from '@/env'

import androidConfig from './configurations/android'
import iosConfig from './configurations/ios'
import webConfig from './configurations/web'

let isConfigured = false

function ConfigCapacitorApp(): void {
  if (isConfigured) return
  isConfigured = true

  switch (ENV.PLATFORM) {
    case ENV.PLATFORMS.ANDROID:
      androidConfig()
      return
    case ENV.PLATFORMS.IOS:
      iosConfig()
      return
    case ENV.PLATFORMS.WEB:
      webConfig()
      return
    default:
      return
  }
}

export default ConfigCapacitorApp
