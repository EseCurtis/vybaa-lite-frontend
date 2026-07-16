export const REWIND_CAPTURE_WORKLET_NAME = 'rewind-capture'

export function createRewindCaptureWorkletSource(frameSize: number = 2048): string {
  return `class RewindCaptureProcessor extends AudioWorkletProcessor {
    constructor() {
      super()
      this.chunk = new Float32Array(${frameSize})
      this.offset = 0
    }

    process(inputs) {
      const channel = inputs[0] && inputs[0][0]
      if (!channel) return true

      let inputOffset = 0
      while (inputOffset < channel.length) {
        const remaining = this.chunk.length - this.offset
        const sampleCount = Math.min(remaining, channel.length - inputOffset)
        this.chunk.set(channel.subarray(inputOffset, inputOffset + sampleCount), this.offset)
        this.offset += sampleCount
        inputOffset += sampleCount

        if (this.offset === this.chunk.length) {
          this.port.postMessage(this.chunk, [this.chunk.buffer])
          this.chunk = new Float32Array(${frameSize})
          this.offset = 0
        }
      }

      return true
    }
  }
  registerProcessor('${REWIND_CAPTURE_WORKLET_NAME}', RewindCaptureProcessor)`
}
