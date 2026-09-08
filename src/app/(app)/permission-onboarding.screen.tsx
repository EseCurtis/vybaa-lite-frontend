import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch, TopNotch } from '@/components/common/notch.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { ensurePushTokenRegistered } from '@/plugins/capacitor/plugins/push-notification.plugin'
import { useToast } from '@/providers/toast.provider'
import { hapticFeedback } from '@/shared/haptic.util'
import { markPermissionOnboardingSeen } from '@/shared/permissions/permission-onboarding.util'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import {
  RiAlarmLine,
  RiCameraLine,
  RiCheckLine,
  RiMicLine,
  RiNotification3Line,
  RiShieldCheckLine,
} from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import type { ComponentType } from 'react'
import { useState } from 'react'

interface PermissionIconProps {
  'aria-hidden'?: boolean
  className?: string
  size?: number
}

interface PermissionExplanation {
  body: string
  icon: ComponentType<PermissionIconProps>
  label: string
  timing: string
}

const PERMISSION_EXPLANATIONS: PermissionExplanation[] = [
  {
    body: 'Get partner messages, goal reminders, and updates when Vybaa is closed.',
    icon: RiNotification3Line,
    label: 'Notifications',
    timing: 'Optional now',
  },
  {
    body: 'Used for spoken Rewind sessions and voice notes. Vybaa does not listen in the background.',
    icon: RiMicLine,
    label: 'Microphone',
    timing: 'Asked when you record',
  },
  {
    body: 'Used only when you choose to take or attach a photo.',
    icon: RiCameraLine,
    label: 'Camera & photos',
    timing: 'Asked when you add a photo',
  },
  {
    body: 'Optional device alarms can make goal reminders harder to miss, with Stop and Snooze.',
    icon: RiAlarmLine,
    label: 'Goal alarms',
    timing: 'Asked when you turn alarms on',
  },
]

function PermissionRow({
  body,
  icon: Icon,
  label,
  timing,
}: PermissionExplanation) {
  return (
    <View className="flex-row items-start gap-3 py-3">
      <View className="size-11 shrink-0 items-center justify-center rounded-2xl bg-card-light-100">
        <Icon aria-hidden className="text-white" size={21} />
      </View>
      <View className="min-w-0 flex-1 gap-1">
        <View className="flex-row flex-wrap items-center justify-between gap-2">
          <Text className="font-bold text-white">{label}</Text>
          <Text className="text-[11px] font-semibold text-card-lighter-3">
            {timing}
          </Text>
        </View>
        <Text className="text-sm leading-5 text-card-lighter-2">{body}</Text>
      </View>
    </View>
  )
}

export default function PermissionOnboardingScreen() {
  const router = useRouter()
  const toast = useToast()
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isEnablingNotifications, setIsEnablingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  )

  async function handleEnableNotifications(): Promise<void> {
    if (isEnablingNotifications || notificationsEnabled) return

    setIsEnablingNotifications(true)
    setNotificationError(null)
    await hapticFeedback.light()

    try {
      await ensurePushTokenRegistered()
      setNotificationsEnabled(true)
      toast.success('Notifications are ready')
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Notifications could not be enabled yet.'
      setNotificationError(message)
    } finally {
      setIsEnablingNotifications(false)
    }
  }

  async function handleContinue(): Promise<void> {
    markPermissionOnboardingSeen()
    await hapticFeedback.light()
    await navigateAfterAuth(router)
  }

  let notificationButtonLabel = 'Enable notifications'
  if (isEnablingNotifications) {
    notificationButtonLabel = 'Setting up notifications...'
  } else if (notificationsEnabled) {
    notificationButtonLabel = 'Notifications enabled'
  }

  return (
    <View className="relative min-h-dvh flex-1 overflow-hidden bg-black text-white">
      <NoiseComponent>
        <TopNotch />
        <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto px-5 pb-5 pt-6">
          <View className="items-start gap-3">
            <View className="size-12 items-center justify-center rounded-2xl bg-card-light">
              <RiShieldCheckLine aria-hidden className="text-white" size={24} />
            </View>
            <Text className="max-w-sm text-[30px] font-black leading-9 text-white">
              Your permissions, your call.
            </Text>
            <Text className="max-w-md text-[15px] leading-6 text-card-lighter-2">
              Here is what Vybaa may ask for and why. Nothing is requested just
              because you opened the app.
            </Text>
          </View>

          <View className="mt-7 rounded-[24px] bg-cardx px-4 py-2">
            {PERMISSION_EXPLANATIONS.map((permission) => (
              <PermissionRow key={permission.label} {...permission} />
            ))}
          </View>

          <View className="mt-4 rounded-2xl bg-card-light-100 p-4">
            <Text className="text-sm font-bold text-white">
              You stay in control
            </Text>
            <Text className="mt-1 text-xs leading-5 text-card-lighter-2">
              Skip anything now. If a feature needs it later, Vybaa will explain
              it again before showing the device prompt.
            </Text>
          </View>

          <View className="mt-auto gap-3 pt-8">
            <Pressable
              accessibilityHint="Allows partner messages and reminders to reach this device"
              accessibilityLabel={
                notificationsEnabled
                  ? 'Notifications enabled'
                  : 'Enable notifications'
              }
              className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-full bg-card-light px-6"
              disabled={isEnablingNotifications || notificationsEnabled}
              onPress={() => void handleEnableNotifications()}
            >
              {notificationsEnabled ? (
                <RiCheckLine aria-hidden className="text-white" size={19} />
              ) : (
                <RiNotification3Line
                  aria-hidden
                  className="text-white"
                  size={19}
                />
              )}
              <Text className="text-sm font-bold text-white">
                {notificationButtonLabel}
              </Text>
            </Pressable>

            {notificationError ? (
              <Text
                aria-live="polite"
                className="px-3 text-center text-xs leading-5 text-warning-yellow"
              >
                {notificationError} You can try again later from the feature
                that needs it.
              </Text>
            ) : null}

            <Button
              aria-label="Continue to Vybaa"
              buttonClassName="bg-white"
              fullWidth
              label={notificationsEnabled ? 'Continue' : 'Continue for now'}
              onClick={() => void handleContinue()}
            />
          </View>
          <BottomNotch />
        </main>
      </NoiseComponent>
    </View>
  )
}
