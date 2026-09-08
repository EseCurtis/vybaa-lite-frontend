import { Camera, type PermissionStatus } from '@capacitor/camera'

import { checkDeviceAlarmPermission } from '@/plugins/capacitor/plugins/device-alarm.plugin'
import { hasPushNotificationPermission } from '@/plugins/capacitor/plugins/push-notification.plugin'
import { hasVoiceRecordingPermission } from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { getGoalAlarmsEnabled } from '@/shared/goal/goal-alarm.service'

export type OnboardingPermissionId =
  | 'camera'
  | 'goalAlarms'
  | 'microphone'
  | 'notifications'

export interface OnboardingPermissionState {
  enabled: boolean
  pending: boolean
}

export type OnboardingPermissionStates = Record<
  OnboardingPermissionId,
  OnboardingPermissionState
>

export const INITIAL_ONBOARDING_PERMISSION_STATES: OnboardingPermissionStates =
  {
    camera: { enabled: false, pending: true },
    goalAlarms: { enabled: false, pending: true },
    microphone: { enabled: false, pending: true },
    notifications: { enabled: false, pending: true },
  }

function isCameraPermissionGranted(status: PermissionStatus): boolean {
  const photosGranted =
    status.photos === 'granted' || status.photos === 'limited'
  return status.camera === 'granted' && photosGranted
}

async function hasCameraPermission(): Promise<boolean> {
  return isCameraPermissionGranted(await Camera.checkPermissions())
}

async function hasGoalAlarmPermission(): Promise<boolean> {
  if (!getGoalAlarmsEnabled()) return false
  return (await checkDeviceAlarmPermission()) === 'granted'
}

function getSettledPermission(
  permission: PromiseSettledResult<boolean>,
): boolean {
  return permission.status === 'fulfilled' && permission.value
}

export async function readOnboardingPermissionStates(): Promise<OnboardingPermissionStates> {
  const [camera, goalAlarms, microphone, notifications] =
    await Promise.allSettled([
      hasCameraPermission(),
      hasGoalAlarmPermission(),
      hasVoiceRecordingPermission(),
      hasPushNotificationPermission(),
    ])

  return {
    camera: { enabled: getSettledPermission(camera), pending: false },
    goalAlarms: {
      enabled: getSettledPermission(goalAlarms),
      pending: false,
    },
    microphone: {
      enabled: getSettledPermission(microphone),
      pending: false,
    },
    notifications: {
      enabled: getSettledPermission(notifications),
      pending: false,
    },
  }
}

export function countGrantedOnboardingPermissions(
  permissionStates: OnboardingPermissionStates,
): number {
  return Object.values(permissionStates).filter(({ enabled }) => enabled).length
}

export function updateOnboardingPermissionState(
  current: OnboardingPermissionStates,
  id: OnboardingPermissionId,
  update: Partial<OnboardingPermissionState>,
): OnboardingPermissionStates {
  return {
    ...current,
    [id]: { ...current[id], ...update },
  }
}

export async function requestCameraAndPhotoPermission(): Promise<boolean> {
  const status = await Camera.requestPermissions({
    permissions: ['camera', 'photos'],
  })
  return isCameraPermissionGranted(status)
}
