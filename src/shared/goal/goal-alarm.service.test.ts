// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  cancelAll: vi.fn<() => Promise<void>>(),
  checkPermission: vi.fn<() => Promise<string>>(),
  getManifest: vi.fn<() => Promise<{ alarms: unknown[]; revision: string }>>(),
  getStatus: vi.fn<
    () => Promise<{
      permission: string
      scheduledCount: number
      supported: boolean
    }>
  >(),
  reconcile: vi.fn<() => Promise<{ scheduledIds: string[] }>>(),
  requestPermission: vi.fn<() => Promise<string>>(),
  updateRegistration: vi.fn<() => Promise<void>>(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true },
}))

vi.mock('@/plugins/capacitor/plugins/device-alarm.plugin', () => ({
  cancelAllDeviceAlarms: mocks.cancelAll,
  checkDeviceAlarmPermission: mocks.checkPermission,
  getDeviceAlarmStatus: mocks.getStatus,
  reconcileDeviceAlarms: mocks.reconcile,
  requestDeviceAlarmPermission: mocks.requestPermission,
}))

vi.mock('@/shared/api/goal.api', () => ({
  goalAPI: {
    getAlarmManifest: mocks.getManifest,
    updateAlarmRegistration: mocks.updateRegistration,
  },
}))

import {
  getGoalAlarmsEnabled,
  requestGoalAlarmSync,
  setGoalAlarmsEnabled,
} from './goal-alarm.service'

describe('goal alarm reconciliation', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('fcmToken', 'device-token')
    mocks.cancelAll.mockReset().mockResolvedValue()
    mocks.checkPermission.mockReset().mockResolvedValue('granted')
    mocks.getManifest.mockReset()
    mocks.getStatus.mockReset().mockResolvedValue({
      permission: 'granted',
      scheduledCount: 1,
      supported: true,
    })
    mocks.reconcile.mockReset().mockResolvedValue({
      scheduledIds: ['goal_v2:occurrence:09:00'],
    })
    mocks.requestPermission.mockReset().mockResolvedValue('granted')
    mocks.updateRegistration.mockReset().mockResolvedValue()
  })

  it('defaults on and reports only successfully scheduled alarm IDs', async () => {
    mocks.getManifest.mockResolvedValue({
      alarms: [
        {
          body: 'Time to move',
          fireAt: '2026-09-08T08:00:00.000Z',
          goalId: 'goal',
          id: 'goal_v2:occurrence:09:00',
          occurrenceId: 'occurrence',
          route: '/app/goal/goal',
          snoozeMinutes: 10,
          title: 'Goal reminder',
        },
      ],
      revision: 'revision-one',
    })

    const status = await requestGoalAlarmSync()

    expect(getGoalAlarmsEnabled()).toBe(true)
    expect(status.scheduledCount).toBe(1)
    expect(mocks.reconcile).toHaveBeenCalledWith(expect.any(Array), [])
    expect(mocks.updateRegistration).toHaveBeenCalledWith({
      alarmIds: ['goal_v2:occurrence:09:00'],
      enabled: true,
      fcmToken: 'device-token',
    })
  })

  it('retains the last native schedule when the manifest is offline', async () => {
    mocks.getManifest.mockRejectedValue(new Error('offline'))

    await expect(requestGoalAlarmSync()).rejects.toThrow('offline')

    expect(mocks.cancelAll).not.toHaveBeenCalled()
    expect(mocks.reconcile).not.toHaveBeenCalled()
    expect(mocks.updateRegistration).not.toHaveBeenCalled()
  })

  it('retries goal-specific snooze cancellation after an offline sync', async () => {
    mocks.getManifest
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        alarms: [{ id: 'goal_v2:occurrence:09:00' }],
        revision: 'revision-after-retry',
      })

    await expect(
      requestGoalAlarmSync({ cancelSnoozesForGoalIds: ['goal-one'] }),
    ).rejects.toThrow('offline')
    await requestGoalAlarmSync()

    expect(mocks.reconcile).toHaveBeenCalledWith(
      [{ id: 'goal_v2:occurrence:09:00' }],
      ['goal-one'],
    )
  })

  it('cancels alarms and keeps push fallback when permission is denied', async () => {
    mocks.getManifest.mockResolvedValue({
      alarms: [{ id: 'goal_v2:occurrence:09:00' }],
      revision: 'revision-two',
    })
    mocks.checkPermission.mockResolvedValue('denied')
    mocks.getStatus.mockResolvedValue({
      permission: 'denied',
      scheduledCount: 0,
      supported: true,
    })

    await requestGoalAlarmSync()

    expect(mocks.cancelAll).toHaveBeenCalledOnce()
    expect(mocks.reconcile).not.toHaveBeenCalled()
    expect(mocks.updateRegistration).toHaveBeenCalledWith({
      alarmIds: [],
      enabled: false,
      fcmToken: 'device-token',
    })
  })

  it('immediately cancels and unregisters alarms when globally disabled', async () => {
    await setGoalAlarmsEnabled(false)

    expect(getGoalAlarmsEnabled()).toBe(false)
    expect(mocks.cancelAll).toHaveBeenCalledOnce()
    expect(mocks.getManifest).not.toHaveBeenCalled()
    expect(mocks.updateRegistration).toHaveBeenCalledWith({
      alarmIds: [],
      enabled: false,
      fcmToken: 'device-token',
    })
  })
})
