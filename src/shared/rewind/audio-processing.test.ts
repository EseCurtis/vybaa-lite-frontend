import { describe, expect, it } from 'vitest'

import {
  applyAdaptiveGain,
  createAdaptiveGainController,
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

  it('learns room noise and still lifts very quiet speech', () => {
    const controller = createAdaptiveGainController()
    const roomTone = new Float32Array(1600).fill(0.002)
    for (let index = 0; index < 8; index += 1) {
      controller.process(roomTone)
    }

    const quietSpeech = new Float32Array(1600).fill(0.0032)
    expect(measureAudioLevel(controller.process(quietSpeech)).rms).toBeGreaterThan(
      0.01,
    )
  })

  it('does not retain speech gain after sustained silence', () => {
    const controller = createAdaptiveGainController()
    controller.process(new Float32Array(1600).fill(0.02))

    const silence = new Float32Array(1600)
    for (let index = 0; index < 8; index += 1) {
      expect(measureAudioLevel(controller.process(silence)).peak).toBe(0)
    }
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
