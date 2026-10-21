import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const native = vi.hoisted(() => ({
  platform: 'ios',
  canDeviceVoiceRecord: vi.fn(async () => ({ value: true })),
  hasAudioRecordingPermission: vi.fn(async () => ({ value: true })),
  startRecording: vi.fn(async () => ({ value: true })),
  stopRecording: vi.fn(),
}))
const legacy = vi.hoisted(() => ({ stopRecording: vi.fn() }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => native.platform },
  registerPlugin: () => native,
}))
vi.mock('@mozartec/capacitor-microphone', () => ({ Microphone: legacy }))

import {
  startVoiceRecording,
  stopVoiceRecording,
} from './voice-recorder.plugin'

beforeEach(() => {
  vi.clearAllMocks()
  native.platform = 'ios'
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('reads the installed native plugin value envelope on iOS and Android', async () => {
  native.stopRecording.mockResolvedValue({
    value: {
      recordDataBase64: 'YWJj',
      mimeType: 'audio/aac',
      msDuration: 3000,
    },
  })
  await startVoiceRecording()
  expect(native.startRecording).toHaveBeenCalledOnce()
  expect(await stopVoiceRecording()).toEqual({
    base64: 'YWJj',
    mimeType: 'audio/aac',
    durationMs: 3000,
    audioUrl: 'data:audio/aac;base64,YWJj',
  })
})

it('retains the legacy native plugin fallback', async () => {
  native.stopRecording.mockRejectedValue(new Error('Plugin is not implemented'))
  legacy.stopRecording.mockResolvedValue({
    base64String: 'YWJj',
    mimeType: 'audio/aac',
    duration: 2000,
  })
  expect(await stopVoiceRecording()).toMatchObject({
    base64: 'YWJj',
    durationMs: 2000,
  })
  expect(legacy.stopRecording).toHaveBeenCalledOnce()
})

it('reports unusable native recordings instead of claiming success', async () => {
  native.stopRecording.mockResolvedValue({
    value: {
      path: 'file://recording',
      mimeType: 'audio/aac',
      msDuration: 3000,
    },
  })
  await expect(stopVoiceRecording()).rejects.toThrow(
    'file path instead of inline audio data',
  )
})

it('releases browser microphone tracks if MediaRecorder cannot start', async () => {
  native.platform = 'web'
  const stop = vi.fn()
  vi.stubGlobal('window', {})
  vi.stubGlobal('navigator', {
    mediaDevices: {
      getUserMedia: async () => ({ getTracks: () => [{ stop }] }),
    },
    permissions: { query: async () => ({ state: 'granted' }) },
  })
  vi.stubGlobal(
    'MediaRecorder',
    class {
      static isTypeSupported() {
        return true
      }
      constructor() {
        throw new Error('Encoder unavailable')
      }
    },
  )
  await expect(startVoiceRecording()).rejects.toThrow('Encoder unavailable')
  expect(stop).toHaveBeenCalledOnce()
})
