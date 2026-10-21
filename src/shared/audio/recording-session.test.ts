import { beforeEach, expect, it, vi } from 'vitest'

import {
  startVoiceRecording,
  stopVoiceRecording,
} from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { VoiceRecordingSession } from './recording-session'

vi.mock('@/plugins/capacitor/plugins/voice-recorder.plugin', () => ({
  startVoiceRecording: vi.fn(),
  stopVoiceRecording: vi.fn(),
}))
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(startVoiceRecording).mockResolvedValue(undefined)
  vi.mocked(stopVoiceRecording).mockResolvedValue({
    audioUrl: 'data:audio/aac;base64,YWJj',
    base64: 'YWJj',
    durationMs: 1000,
    mimeType: 'audio/aac',
  })
})

it('prevents another control from taking or stopping an owned recording', async () => {
  const first = new VoiceRecordingSession()
  const second = new VoiceRecordingSession()
  await first.start()
  await expect(second.start()).rejects.toThrow('Another recording')
  await expect(second.stop()).rejects.toThrow('No recording')
  expect(stopVoiceRecording).not.toHaveBeenCalled()
  await first.stop()
  const third = new VoiceRecordingSession()
  await third.start()
  await third.stop()
})

it('deduplicates stop and cancellation during a pending recording start', async () => {
  let resolve: () => void = () => undefined
  vi.mocked(startVoiceRecording).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  const session = new VoiceRecordingSession()
  const starting = session.start()
  const stopping = session.stop()
  expect(session.stop()).toBe(stopping)
  resolve()
  await starting
  await stopping
  expect(stopVoiceRecording).toHaveBeenCalledOnce()
})
