import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  addListeners: vi.fn<() => Promise<void>>(),
  createChannels: vi.fn<() => Promise<void>>(),
  ensureVoicePermission: vi.fn<() => Promise<void>>(),
  getSafeAreaInsets: vi.fn<() => Promise<{ insets: Record<string, number> }>>(),
  registerPush: vi.fn<() => Promise<void>>(),
}))

vi.mock('@/shared/constants.shared', () => ({ IS_ANDROID: false }))

vi.mock('capacitor-plugin-safe-area', () => ({
  SafeArea: { getSafeAreaInsets: mocks.getSafeAreaInsets },
}))

vi.mock('../plugins/push-notification.plugin', () => ({
  addPushNotificationListeners: mocks.addListeners,
  createPushNotificationChannels: mocks.createChannels,
  registerPushNotifications: mocks.registerPush,
}))

vi.mock('../plugins/voice-recorder.plugin', () => ({
  ensureVoiceRecordingPermission: mocks.ensureVoicePermission,
}))

import mobileConfig from './mobile'

describe('native startup configuration', () => {
  beforeEach(() => {
    mocks.addListeners.mockReset().mockResolvedValue(undefined)
    mocks.createChannels.mockReset().mockResolvedValue(undefined)
    mocks.ensureVoicePermission.mockReset().mockResolvedValue(undefined)
    mocks.getSafeAreaInsets.mockReset().mockResolvedValue({ insets: {} })
    mocks.registerPush.mockReset().mockResolvedValue(undefined)
  })

  it('does not request notification or microphone permission on launch', async () => {
    await mobileConfig()

    expect(mocks.addListeners).toHaveBeenCalledOnce()
    expect(mocks.createChannels).toHaveBeenCalledOnce()
    expect(mocks.getSafeAreaInsets).toHaveBeenCalledOnce()
    expect(mocks.registerPush).not.toHaveBeenCalled()
    expect(mocks.ensureVoicePermission).not.toHaveBeenCalled()
  })
})
