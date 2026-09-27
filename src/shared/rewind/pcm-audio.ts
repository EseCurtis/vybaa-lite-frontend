export const GEMINI_OUTPUT_SAMPLE_RATE = 24000

export type DecodedPcmAudio = {
  sampleRate: number
  samples: Float32Array
}

export function parsePcmSampleRate(mimeType: string): number | null {
  if (!/^audio\/pcm(?:;|$)/i.test(mimeType.trim())) return null

  const rateMatch = mimeType.match(/(?:^|;)\s*rate=(\d+)/i)
  if (!rateMatch) return GEMINI_OUTPUT_SAMPLE_RATE

  const sampleRate = Number(rateMatch[1])
  return Number.isInteger(sampleRate) && sampleRate >= 8000 && sampleRate <= 192000
    ? sampleRate
    : null
}

export function decodePcmAudioChunk(
  data: string,
  mimeType: string,
): DecodedPcmAudio {
  const sampleRate = parsePcmSampleRate(mimeType)
  if (!sampleRate) throw new Error('Unsupported PCM audio format')

  const binary = atob(data)
  if (binary.length % 2 !== 0) {
    throw new Error('PCM audio payload must contain complete 16-bit samples')
  }

  const samples = new Float32Array(binary.length / 2)
  for (let byteIndex = 0; byteIndex < binary.length; byteIndex += 2) {
    const unsignedSample =
      (binary.charCodeAt(byteIndex) & 0xff) |
      ((binary.charCodeAt(byteIndex + 1) & 0xff) << 8)
    const signedSample =
      unsignedSample >= 0x8000 ? unsignedSample - 0x10000 : unsignedSample
    samples[byteIndex / 2] = signedSample / 32768
  }

  return { sampleRate, samples }
}
