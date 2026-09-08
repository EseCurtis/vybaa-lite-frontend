// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addListener: vi.fn(),
  checkPermissions: vi.fn(),
  register: vi.fn(),
  requestPermissions: vi.fn(),
  syncFcmToken: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'ios' },
}))

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    addListener: mocks.addListener,
    checkPermissions: mocks.checkPermissions,
    register: mocks.register,
    requestPermissions: mocks.requestPermissions,
  },
}))

vi.mock('@/shared/api/user.api', () => ({
  userAPI: { syncFCMToken: mocks.syncFcmToken },
}))

import {
  ensurePushTokenRegistered,
  hasPushNotificationPermission,
} from './push-notification.plugin'

describe('push token registration', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.addListener.mockReset().mockResolvedValue({
      remove: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    })
    mocks.checkPermissions.mockReset()
    mocks.register.mockReset().mockResolvedValue(undefined)
    mocks.requestPermissions.mockReset()
    mocks.syncFcmToken.mockReset().mockResolvedValue(undefined)
  })

  it('does not treat a stored token as enabled after permission is denied', async () => {
    localStorage.setItem('fcmToken', 'stored-token')
    mocks.checkPermissions.mockResolvedValue({ receive: 'denied' })

    await expect(ensurePushTokenRegistered()).rejects.toThrow(
      'Notifications are off in your device settings.',
    )
    expect(mocks.syncFcmToken).not.toHaveBeenCalled()
  })

  it('reuses and syncs a stored token when permission is granted', async () => {
    localStorage.setItem('fcmToken', 'stored-token')
    mocks.checkPermissions.mockResolvedValue({ receive: 'granted' })

    await expect(ensurePushTokenRegistered()).resolves.toBe('stored-token')
    expect(mocks.syncFcmToken).toHaveBeenCalledWith('stored-token')
    expect(mocks.register).not.toHaveBeenCalled()
  })

  it('reads permission state without requesting it', async () => {
    mocks.checkPermissions.mockResolvedValue({ receive: 'granted' })

    await expect(hasPushNotificationPermission()).resolves.toBe(true)
    expect(mocks.requestPermissions).not.toHaveBeenCalled()
    expect(mocks.register).not.toHaveBeenCalled()
  })
})
