import { describe, expect, it } from 'vitest'

import {
  getRewindCaptureFrameSize,
  REWIND_CAPTURE_FRAME_DURATION_MS,
} from './rewind-audio-worklet'

describe('getRewindCaptureFrameSize', () => {
  it('creates 100 ms source frames at common microphone sample rates', () => {
    expect(REWIND_CAPTURE_FRAME_DURATION_MS).toBe(100)
    expect(getRewindCaptureFrameSize(48_000)).toBe(4_800)
    expect(getRewindCaptureFrameSize(44_100)).toBe(4_410)
    expect(getRewindCaptureFrameSize(16_000)).toBe(1_600)
  })

  it('rejects invalid capture settings', () => {
    expect(() => getRewindCaptureFrameSize(0)).toThrow(
      'A valid capture sample rate is required',
    )
    expect(() => getRewindCaptureFrameSize(48_000, 0)).toThrow(
      'A valid capture frame duration is required',
    )
  })
})
