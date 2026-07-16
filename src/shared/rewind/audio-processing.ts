export const REWIND_PCM_SAMPLE_RATE = 16000

export type AudioLevel = {
  peak: number
  rms: number
}

export type AdaptiveGainOptions = {
  limiterCeiling: number
  maxGain: number
  noiseFloor: number
  targetRms: number
}

export type AdaptiveGainController = {
  process: (input: Float32Array) => Float32Array
  reset: () => void
}

const DEFAULT_ADAPTIVE_GAIN_OPTIONS: AdaptiveGainOptions = {
  limiterCeiling: 0.92,
  maxGain: 8,
  noiseFloor: 0.0035,
  targetRms: 0.11,
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

function limitSample(sample: number, ceiling: number): number {
  return Math.max(-ceiling, Math.min(ceiling, sample))
}

export function applyAdaptiveGain(
  input: Float32Array,
  options: AdaptiveGainOptions = DEFAULT_ADAPTIVE_GAIN_OPTIONS,
): Float32Array {
  const { peak, rms } = measureAudioLevel(input)
  if (peak === 0 || rms < options.noiseFloor) {
    // Keep silence and room tone intact but do not amplify either. The Live VAD
    // receives a truthful signal instead of a hard-gated stream with clipped words.
    return new Float32Array(input)
  }

  const desiredGain = Math.min(options.maxGain, options.targetRms / rms)
  const limiterGain = Math.min(desiredGain, options.limiterCeiling / peak)
  const output = new Float32Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    output[index] = limitSample(input[index] * limiterGain, options.limiterCeiling)
  }
  return output
}

export function createAdaptiveGainController(
  options: AdaptiveGainOptions = DEFAULT_ADAPTIVE_GAIN_OPTIONS,
): AdaptiveGainController {
  let gain = 1

  return {
    process(input: Float32Array): Float32Array {
      const { peak, rms } = measureAudioLevel(input)
      if (peak === 0 || rms < options.noiseFloor) {
        gain += (1 - gain) * 0.08
        return new Float32Array(input)
      }

      const desiredGain = Math.min(options.maxGain, options.targetRms / rms)
      const smoothing = desiredGain > gain ? 0.22 : 0.08
      gain += (desiredGain - gain) * smoothing
      const limiterGain = Math.min(gain, options.limiterCeiling / peak)
      const output = new Float32Array(input.length)
      for (let index = 0; index < input.length; index += 1) {
        output[index] = limitSample(
          input[index] * limiterGain,
          options.limiterCeiling,
        )
      }
      return output
    },
    reset(): void {
      gain = 1
    },
  }
}

export function resampleFloat32Audio(
  input: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number = REWIND_PCM_SAMPLE_RATE,
): Float32Array {
  if (!Number.isFinite(inputSampleRate) || inputSampleRate <= 0) {
    throw new Error('A valid input sample rate is required')
  }
  if (!Number.isFinite(outputSampleRate) || outputSampleRate <= 0) {
    throw new Error('A valid output sample rate is required')
  }
  if (inputSampleRate === outputSampleRate) return new Float32Array(input)
  if (input.length === 0) return new Float32Array()

  const outputLength = Math.max(
    1,
    Math.round((input.length * outputSampleRate) / inputSampleRate),
  )
  const output = new Float32Array(outputLength)
  const ratio = inputSampleRate / outputSampleRate

  for (let index = 0; index < outputLength; index += 1) {
    const sourcePosition = index * ratio
    const sourceIndex = Math.floor(sourcePosition)
    const nextIndex = Math.min(sourceIndex + 1, input.length - 1)
    const fraction = sourcePosition - sourceIndex
    const left = input[Math.min(sourceIndex, input.length - 1)]
    const right = input[nextIndex]
    output[index] = left + (right - left) * fraction
  }

  return output
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
