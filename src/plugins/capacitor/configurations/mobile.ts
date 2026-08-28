import { IS_ANDROID } from '@/shared/constants.shared'
import { SafeArea } from 'capacitor-plugin-safe-area'

import { ensureVoiceRecordingPermission } from '../plugins/voice-recorder.plugin'
import {
  addPushNotificationListeners,
  createPushNotificationChannels,
  registerPushNotifications,
} from '../plugins/push-notification.plugin'

const mobileConfig = async (): Promise<void> => {
  await Promise.allSettled([
    registerPushNotifications(),
    addPushNotificationListeners(),
    createPushNotificationChannels(),
    ensureVoiceRecordingPermission(),
    SafeArea.getSafeAreaInsets().then(({ insets }) => {
      for (const [key, rawValue] of Object.entries(insets)) {
        let value = rawValue

        if (key === 'bottom' && IS_ANDROID) {
          value += 20
        }

        document.documentElement.style.setProperty(
          `--safe-area-inset-${key}`,
          `${value}px`,
        )
      }
    }),
  ])
}

export default mobileConfig
