import { Capacitor, registerPlugin } from '@capacitor/core'

import type { GoalAlarmManifestItem } from '@/shared/api/goal.api'

export type DeviceAlarmPermissionState =
  | 'denied'
  | 'granted'
  | 'prompt'
  | 'unsupported'

export type DeviceAlarmStatus = {
  permission: DeviceAlarmPermissionState
  scheduledCount: number
  supported: boolean
}

type DeviceAlarmReconcileResult = {
  scheduledIds: string[]
}

type DeviceAlarmAction = {
  alarmId: string
  route?: string
  type: 'opened' | 'snoozed' | 'stopped'
}

type PluginListenerHandle = {
  remove: () => Promise<void>
}

interface NativeDeviceAlarmPlugin {
  addListener(
    eventName: 'alarmAction',
    listener: (event: DeviceAlarmAction) => void,
  ): Promise<PluginListenerHandle>
  cancelAll(): Promise<void>
  checkPermission(): Promise<{ state: DeviceAlarmPermissionState }>
  getStatus(): Promise<DeviceAlarmStatus>
  reconcile(input: {
    alarms: GoalAlarmManifestItem[]
    cancelSnoozesForGoalIds: string[]
  }): Promise<DeviceAlarmReconcileResult>
  requestPermission(): Promise<{ state: DeviceAlarmPermissionState }>
}

const NativeDeviceAlarm = registerPlugin<NativeDeviceAlarmPlugin>('DeviceAlarm')

export async function addDeviceAlarmActionListener(
  listener: (event: DeviceAlarmAction) => void,
): Promise<PluginListenerHandle | null> {
  if (!Capacitor.isNativePlatform()) return null
  return NativeDeviceAlarm.addListener('alarmAction', listener)
}

export async function cancelAllDeviceAlarms(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  await NativeDeviceAlarm.cancelAll()
}

export async function checkDeviceAlarmPermission(): Promise<DeviceAlarmPermissionState> {
  if (!Capacitor.isNativePlatform()) return 'unsupported'
  return (await NativeDeviceAlarm.checkPermission()).state
}

export async function getDeviceAlarmStatus(): Promise<DeviceAlarmStatus> {
  if (!Capacitor.isNativePlatform()) {
    return { permission: 'unsupported', scheduledCount: 0, supported: false }
  }
  return NativeDeviceAlarm.getStatus()
}

export async function reconcileDeviceAlarms(
  alarms: GoalAlarmManifestItem[],
  cancelSnoozesForGoalIds: string[] = [],
): Promise<DeviceAlarmReconcileResult> {
  if (!Capacitor.isNativePlatform()) return { scheduledIds: [] }
  return NativeDeviceAlarm.reconcile({ alarms, cancelSnoozesForGoalIds })
}

export async function requestDeviceAlarmPermission(): Promise<DeviceAlarmPermissionState> {
  if (!Capacitor.isNativePlatform()) return 'unsupported'
  return (await NativeDeviceAlarm.requestPermission()).state
}
