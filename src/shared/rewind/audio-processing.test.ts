import { describe, expect, it } from 'vitest'

import {
  applyAdaptiveGain,
  floatTo16BitPcmBase64,
  measureAudioLevel,
  resampleFloat32Audio,
} from './audio-processing'

describe('Rewind adaptive gain', () => {
  it('amplifies quiet speech toward the target level', () => {
    const quiet = new Float32Array(256).fill(0.02)
    expect(measureAudioLevel(applyAdaptiveGain(quiet)).rms).toBeGreaterThan(0.07)
  })

  it('does not amplify silence or background noise', () => {
    const noise = new Float32Array(256).fill(0.002)
    expect(measureAudioLevel(applyAdaptiveGain(noise)).peak).toBeCloseTo(0.002)
    expect(measureAudioLevel(applyAdaptiveGain(new Float32Array(256))).peak).toBe(0)
  })

  it('limits loud input without clipping', () => {
    const loud = new Float32Array([1, -1, 0.8, -0.8])
    expect(measureAudioLevel(applyAdaptiveGain(loud)).peak).toBeLessThanOrEqual(0.92)
  })

  it('resamples 48 kHz and 44.1 kHz input to 16 kHz', () => {
    const fortyEightKhz = resampleFloat32Audio(
      new Float32Array(480).fill(0.1),
      48000,
    )
    const fortyFourKhz = resampleFloat32Audio(
      new Float32Array(441).fill(0.1),
      44100,
    )

    expect(fortyEightKhz).toHaveLength(160)
    expect(fortyFourKhz).toHaveLength(160)
  })

  it('serializes valid signed 16-bit PCM', () => {
    const pcm = floatTo16BitPcmBase64(new Float32Array([-1, 0, 1]))
    expect(atob(pcm)).toHaveLength(6)
  })
})
