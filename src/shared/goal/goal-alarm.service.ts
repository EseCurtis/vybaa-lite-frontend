import { Capacitor } from '@capacitor/core'

import {
  cancelAllDeviceAlarms,
  checkDeviceAlarmPermission,
  getDeviceAlarmStatus,
  reconcileDeviceAlarms,
  requestDeviceAlarmPermission,
  type DeviceAlarmStatus,
} from '@/plugins/capacitor/plugins/device-alarm.plugin'
import { ensurePushTokenRegistered } from '@/plugins/capacitor/plugins/push-notification.plugin'
import { goalAPI } from '@/shared/api/goal.api'

const GOAL_ALARMS_ENABLED_KEY = 'goal-alarms-enabled'
const GOAL_ALARMS_ONBOARDING_SEEN_KEY = 'goal-alarms-onboarding-seen'

let activeSync: Promise<DeviceAlarmStatus> | null = null
const snoozeCancellationGoalIds = new Set<string>()
let syncRequested = false

type GoalAlarmSyncOptions = {
  cancelSnoozesForGoalIds?: string[]
}

function getFcmToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fcmToken')
}

async function updateRegistration(
  enabled: boolean,
  alarmIds: string[],
): Promise<void> {
  const fcmToken = getFcmToken()
  if (!fcmToken) return
  await goalAPI.updateAlarmRegistration({ alarmIds, enabled, fcmToken })
}

async function performGoalAlarmSync(
  cancelSnoozesForGoalIds: string[],
): Promise<DeviceAlarmStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { permission: 'unsupported', scheduledCount: 0, supported: false }
  }
  if (!getGoalAlarmsEnabled()) {
    await cancelAllDeviceAlarms()
    await updateRegistration(false, [])
    return getDeviceAlarmStatus()
  }

  await ensurePushTokenRegistered()

  const manifest = await goalAPI.getAlarmManifest()
  if (!manifest.alarms.length) {
    await cancelAllDeviceAlarms()
    await updateRegistration(true, [])
    return getDeviceAlarmStatus()
  }

  let permission = await checkDeviceAlarmPermission()
  if (permission === 'prompt') {
    permission = await requestDeviceAlarmPermission()
  }
  if (permission !== 'granted') {
    await cancelAllDeviceAlarms()
    await updateRegistration(false, [])
    return getDeviceAlarmStatus()
  }

  const result = await reconcileDeviceAlarms(
    manifest.alarms,
    cancelSnoozesForGoalIds,
  )
  await updateRegistration(true, result.scheduledIds)
  return getDeviceAlarmStatus()
}

async function runGoalAlarmSyncLoop(): Promise<DeviceAlarmStatus> {
  let status = await getDeviceAlarmStatus()
  do {
    syncRequested = false
    const cancelSnoozesForGoalIds = [...snoozeCancellationGoalIds]
    snoozeCancellationGoalIds.clear()
    try {
      status = await performGoalAlarmSync(cancelSnoozesForGoalIds)
    } catch (error: unknown) {
      for (const goalId of cancelSnoozesForGoalIds) {
        snoozeCancellationGoalIds.add(goalId)
      }
      throw error
    }
  } while (syncRequested)
  return status
}

export function getGoalAlarmsEnabled(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(GOAL_ALARMS_ENABLED_KEY) === 'true'
}

export function hasSeenGoalAlarmOnboarding(): boolean {
  if (typeof window === 'undefined') return true
  return localStorage.getItem(GOAL_ALARMS_ONBOARDING_SEEN_KEY) === 'true'
}

export function markGoalAlarmOnboardingSeen(): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GOAL_ALARMS_ONBOARDING_SEEN_KEY, 'true')
}

export function requestGoalAlarmSync(
  options: GoalAlarmSyncOptions = {},
): Promise<DeviceAlarmStatus> {
  for (const goalId of options.cancelSnoozesForGoalIds ?? []) {
    snoozeCancellationGoalIds.add(goalId)
  }
  syncRequested = true
  if (!activeSync) {
    activeSync = runGoalAlarmSyncLoop().finally(() => {
      activeSync = null
    })
  }
  return activeSync
}

export async function setGoalAlarmsEnabled(
  enabled: boolean,
): Promise<DeviceAlarmStatus> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GOAL_ALARMS_ENABLED_KEY, String(enabled))
  }
  if (!enabled) {
    if (activeSync) {
      await activeSync.catch(() => undefined)
    }
    await cancelAllDeviceAlarms()
    await updateRegistration(false, [])
    return getDeviceAlarmStatus()
  }
  if ((await checkDeviceAlarmPermission()) === 'denied') {
    await requestDeviceAlarmPermission()
  }
  return requestGoalAlarmSync()
}
