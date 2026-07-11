import { describe, expect, it } from 'vitest'

import { applyAdaptiveGain, measureAudioLevel } from './audio-processing'

describe('Rewind adaptive gain', () => {
  it('amplifies quiet speech toward the target level', () => {
    const quiet = new Float32Array(256).fill(0.02)
    expect(measureAudioLevel(applyAdaptiveGain(quiet)).rms).toBeGreaterThan(0.07)
  })

  it('does not amplify silence or background noise', () => {
    const noise = new Float32Array(256).fill(0.002)
    expect(measureAudioLevel(applyAdaptiveGain(noise)).peak).toBe(0)
  })

  it('limits loud input without clipping', () => {
    const loud = new Float32Array([1, -1, 0.8, -0.8])
    expect(measureAudioLevel(applyAdaptiveGain(loud)).peak).toBeLessThanOrEqual(0.95)
  })
})
