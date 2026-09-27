import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch, TopNotch } from '@/components/common/notch.component'
import { Switch } from '@/components/common/switch.component'
import { Button } from '@/components/layout/button.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  checkDeviceAlarmPermission,
  requestDeviceAlarmPermission,
  type DeviceAlarmPermissionState,
} from '@/plugins/capacitor/plugins/device-alarm.plugin'
import { ensurePushTokenRegistered } from '@/plugins/capacitor/plugins/push-notification.plugin'
import { ensureVoiceRecordingPermission } from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { setGoalAlarmsEnabled } from '@/shared/goal/goal-alarm.service'
import { hapticFeedback } from '@/shared/haptic.util'
import {
  INITIAL_ONBOARDING_PERMISSION_STATES,
  readOnboardingPermissionStates,
  requestCameraAndPhotoPermission,
  updateOnboardingPermissionState,
  type OnboardingPermissionId,
  type OnboardingPermissionState,
} from '@/shared/permissions/device-permission-state.util'
import {
  markOnboardingSkipped,
  markPermissionOnboardingSeen,
  markRewindPartnerOnboardingSeen,
} from '@/shared/permissions/permission-onboarding.util'
import { navigateAfterAuth } from '@/shared/utils/auth-redirect.util'
import {
  RiAlarmLine,
  RiCameraLine,
  RiLoader4Line,
  RiMicLine,
  RiNotification3Line,
  type RemixiconComponentType,
} from '@remixicon/react'
import { useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

interface PermissionOption {
  body: string
  icon: RemixiconComponentType
  iconClassName: string
  iconSurfaceClassName: string
  id: OnboardingPermissionId
  label: string
}

const PERMISSION_OPTIONS: PermissionOption[] = [
  {
    body: 'This is used for partner messages, reminders, and important updates.',
    icon: RiNotification3Line,
    iconClassName: 'text-accent-200',
    iconSurfaceClassName: 'bg-accent-900',
    id: 'notifications',
    label: 'Notifications',
  },
  {
    body: 'This is used when you talk with your Rewind partner or record a voice note.',
    icon: RiMicLine,
    iconClassName: 'text-success-300',
    iconSurfaceClassName: 'bg-success-900',
    id: 'microphone',
    label: 'Microphone',
  },
  {
    body: 'This is used for your profile photo and images you share in communities.',
    icon: RiCameraLine,
    iconClassName: 'text-burnt-coffee-100',
    iconSurfaceClassName: 'bg-burnt-coffee-700',
    id: 'camera',
    label: 'Camera & photos',
  },
  {
    body: 'This is used for goal alarms that ring even when the app is closed.',
    icon: RiAlarmLine,
    iconClassName: 'text-warning-yellow',
    iconSurfaceClassName: 'bg-warning-900',
    id: 'goalAlarms',
    label: 'Goal alarms',
  },
]

async function requestGoalAlarmPermission(): Promise<boolean> {
  let alarmEnabled = false
  let permission: DeviceAlarmPermissionState = 'denied'
  try {
    permission = await checkDeviceAlarmPermission()
    if (permission !== 'granted' && permission !== 'unsupported') {
      permission = await requestDeviceAlarmPermission()
    }
    if (permission !== 'granted') return false

    alarmEnabled = (await setGoalAlarmsEnabled(true)).permission === 'granted'
    return alarmEnabled
  } finally {
    if (!alarmEnabled) {
      await Promise.allSettled([setGoalAlarmsEnabled(false)])
    }
  }
}

async function requestPermission(id: OnboardingPermissionId): Promise<boolean> {
  if (id === 'notifications') {
    await ensurePushTokenRegistered()
    return true
  }
  if (id === 'microphone') {
    return ensureVoiceRecordingPermission()
  }
  if (id === 'camera') {
    return requestCameraAndPhotoPermission()
  }
  return requestGoalAlarmPermission()
}

function permissionDeniedMessage(id: OnboardingPermissionId): string {
  if (id === 'notifications') return 'Notifications stayed off.'
  if (id === 'microphone') return 'Microphone access stayed off.'
  if (id === 'camera') return 'Camera and photo access stayed off.'
  return 'Goal alarms stayed off.'
}

function PermissionRow({
  body,
  icon: Icon,
  iconClassName,
  iconSurfaceClassName,
  id,
  label,
  onToggle,
  state,
}: PermissionOption & {
  onToggle: (id: OnboardingPermissionId, enabled: boolean) => void
  state: OnboardingPermissionState
}) {
  return (
    <View className="min-h-[84px] flex-row items-start gap-3 py-3">
      <View
        className={`p-2 shrink-0 items-center justify-center rounded-lg ${iconSurfaceClassName}`}
      >
        <Icon aria-hidden className={iconClassName} size={21} />
      </View>
      <View className="min-w-0 flex-1 gap-1 pr-2">
        <Text className="font-bold text-white">{label}</Text>
        <Text className="text-xs leading-5 text-card-lighter-2">{body}</Text>
      </View>
      <View className="h-11 w-12 items-center justify-center">
        {state.pending ? (
          <RiLoader4Line
            aria-label={`Checking ${label.toLowerCase()} permission`}
            className="animate-spin text-card-lighter-2"
            role="status"
            size={21}
          />
        ) : (
          <Switch
            accessibilityLabel={`${label} permission`}
            checked={state.enabled}
            onChange={(enabled) => onToggle(id, enabled)}
          />
        )}
      </View>
    </View>
  )
}

export default function PermissionOnboardingScreen() {
  const router = useRouter()
  const toast = useToast()
  const { user } = useAuth()
  const [permissionStates, setPermissionStates] = useState(
    INITIAL_ONBOARDING_PERMISSION_STATES,
  )
  const isProcessingPermission = Object.values(permissionStates).some(
    ({ pending }) => pending,
  )

  useEffect(() => {
    if (!user) return

    markPermissionOnboardingSeen(user.id)
    let isMounted = true
    void readOnboardingPermissionStates().then((states) => {
      if (isMounted) setPermissionStates(states)
    })
    return () => {
      isMounted = false
    }
  }, [user])

  async function handleSkip(): Promise<void> {
    if (!user) return
    markOnboardingSkipped(user.id)
    await hapticFeedback.light()
    await navigateAfterAuth(router, user)
  }

  async function handleContinue(): Promise<void> {
    if (!user) return
    markPermissionOnboardingSeen(user.id)
    await hapticFeedback.light()
    if (user.rewindPersona) {
      markRewindPartnerOnboardingSeen(user.id)
      await navigateAfterAuth(router, user)
      return
    }
    await router.navigate({
      replace: true,
      to: '/app/onboarding/rewind-partner',
    })
  }

  async function handlePermissionToggle(
    id: OnboardingPermissionId,
    enabled: boolean,
  ): Promise<void> {
    await hapticFeedback.selection()

    if (!enabled) {
      if (id === 'goalAlarms') {
        setPermissionStates((current) =>
          updateOnboardingPermissionState(current, id, { pending: true }),
        )
        try {
          await setGoalAlarmsEnabled(false)
          setPermissionStates((current) =>
            updateOnboardingPermissionState(current, id, {
              enabled: false,
              pending: false,
            }),
          )
        } catch {
          setPermissionStates((current) =>
            updateOnboardingPermissionState(current, id, { pending: false }),
          )
          toast.info('Goal alarms could not be changed.')
        }
        return
      }

      toast.info('Turn this off in your device settings.')
      return
    }

    setPermissionStates((current) =>
      updateOnboardingPermissionState(current, id, { pending: true }),
    )

    try {
      const granted = await requestPermission(id)
      setPermissionStates(await readOnboardingPermissionStates())
      if (!granted) toast.info(permissionDeniedMessage(id))
    } catch {
      setPermissionStates((current) =>
        updateOnboardingPermissionState(current, id, {
          enabled: false,
          pending: false,
        }),
      )
      toast.info(permissionDeniedMessage(id))
    }
  }

  return (
    <View className="relative min-h-dvh flex-1 overflow-hidden bg-cardd text-white">
      <NoiseComponent>
        <header className="fixed inset-x-0 top-0 z-30 ">
          <TopNotch />
          <View className="mx-auto h-14 w-full max-w-xl flex-row items-center justify-between px-5">
            <Text className="text-lg font-bold text-white">Permissions</Text>
            <Pressable
              accessibilityLabel="Skip permission setup"
              className="min-h-11 min-w-11 items-center justify-center px-2"
              onPress={() => void handleSkip()}
            >
              <Text className="text-sm font-bold text-white">Skip</Text>
            </Pressable>
          </View>
        </header>

        <main className="mx-auto flex min-h-0 w-full max-w-xl flex-1 flex-col overflow-y-auto px-5 pb-5 pt-[calc(var(--safe-area-inset-top)+76px)]">
          <View className="mt-0 rounded-[24px]  py-1">
            {PERMISSION_OPTIONS.map((permission) => (
              <PermissionRow
                key={permission.id}
                {...permission}
                onToggle={(id, enabled) =>
                  void handlePermissionToggle(id, enabled)
                }
                state={permissionStates[permission.id]}
              />
            ))}
          </View>

          <View className="mt-auto rounded-3xl bg-cardd px-3 py-7">
            <Text className="max-w-sm text-[24px] !text-center font-black leading-snug text-white">
              {user?.firstName}, Decide what Vybaa can use.
            </Text>
            <Text className="max-w-[300px] mx-auto !text-center text-sm leading-6 text-card-lighter-2">
              Turn on what you want. Change it later in Settings.
            </Text>
          </View>

          <View className="flex-row items-center gap-3  mt-4 w-full justify-between">
            <Button
              aria-label="Back"
              className=" bg-cardd"
              disabled
              label="Back"
              variant="secondary"
            />

            <Text className="text-center text-xs font-bold text-card-lighter-3">
              1 / 2
            </Text>
            <Button
              aria-label="Continue to Rewind partner selection"
              disabled={isProcessingPermission}
              label="Next"
              loading={isProcessingPermission}
              onClick={() => void handleContinue()}
            />
          </View>

          <BottomNotch />
        </main>
      </NoiseComponent>
    </View>
  )
}
