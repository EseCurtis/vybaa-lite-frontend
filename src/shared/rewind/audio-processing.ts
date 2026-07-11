export type AudioLevel = {
  peak: number
  rms: number
}

export type AdaptiveGainOptions = {
  maxGain: number
  noiseFloor: number
  targetRms: number
}

export function measureAudioLevel(input: Float32Array): AudioLevel {
  let peak = 0
  let sumSquares = 0
  for (const sample of input) {
    const absoluteSample = Math.abs(sample)
    peak = Math.max(peak, absoluteSample)
    sumSquares += sample * sample
  }
  return { peak, rms: input.length ? Math.sqrt(sumSquares / input.length) : 0 }
}

export function applyAdaptiveGain(
  input: Float32Array,
  options: AdaptiveGainOptions = {
    maxGain: 4,
    noiseFloor: 0.006,
    targetRms: 0.12,
  },
): Float32Array {
  const { peak, rms } = measureAudioLevel(input)
  if (rms < options.noiseFloor || peak === 0) return new Float32Array(input.length)

  const desiredGain = Math.min(options.maxGain, options.targetRms / rms)
  const limiterGain = Math.min(desiredGain, 0.95 / peak)
  return input.map((sample) => Math.max(-0.95, Math.min(0.95, sample * limiterGain)))
}

export function floatTo16BitPcmBase64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2)
  const view = new DataView(buffer)
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    view.setInt16(index * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
  }

  let binary = ''
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return btoa(binary)
}
