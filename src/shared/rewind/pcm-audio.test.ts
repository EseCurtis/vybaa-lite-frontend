import { describe, expect, it } from 'vitest'

import {
  decodePcmAudioChunk,
  GEMINI_OUTPUT_SAMPLE_RATE,
  parsePcmSampleRate,
} from './pcm-audio'

function toBase64(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes))
}

describe('Gemini PCM audio', () => {
  it('uses the sample rate declared by Gemini', () => {
    expect(parsePcmSampleRate('audio/pcm;rate=16000')).toBe(16000)
    expect(parsePcmSampleRate('audio/pcm;rate=24000')).toBe(24000)
    expect(parsePcmSampleRate('audio/pcm')).toBe(GEMINI_OUTPUT_SAMPLE_RATE)
  })

  it('rejects unsupported or invalid formats', () => {
    expect(parsePcmSampleRate('audio/mp3')).toBeNull()
    expect(parsePcmSampleRate('audio/pcm;rate=0')).toBeNull()
    expect(() => decodePcmAudioChunk(toBase64([1]), 'audio/pcm')).toThrow()
  })

  it('decodes signed little-endian 16-bit PCM', () => {
    const decoded = decodePcmAudioChunk(
      toBase64([0x00, 0x80, 0x00, 0x00, 0xff, 0x7f]),
      'audio/pcm;rate=24000',
    )

    expect(decoded.samples[0]).toBe(-1)
    expect(decoded.samples[1]).toBe(0)
    expect(decoded.samples[2]).toBeCloseTo(0.9999, 3)
  })
})
