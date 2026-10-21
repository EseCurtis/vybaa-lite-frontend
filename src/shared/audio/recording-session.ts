import {
  startVoiceRecording,
  stopVoiceRecording,
} from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import type { VoiceRecordingResult } from '@/plugins/capacitor/plugins/voice-recorder.plugin'

let owner: VoiceRecordingSession | null = null

// The native recorder is process-wide. Only its owning control may stop it.
export class VoiceRecordingSession {
  private starting: Promise<void> | null = null
  private stopping: Promise<VoiceRecordingResult> | null = null

  public async start(): Promise<void> {
    if (owner) throw new Error('Another recording is already in progress.')
    owner = this
    this.starting = startVoiceRecording()
    try {
      await this.starting
    } catch (error: unknown) {
      if (owner === this) owner = null
      throw error
    }
  }

  public stop(): Promise<VoiceRecordingResult> {
    if (!this.stopping) this.stopping = this.finish()
    return this.stopping
  }

  private async finish(): Promise<VoiceRecordingResult> {
    try {
      if (!this.starting) throw new Error('No recording is in progress.')
      await this.starting
      if (owner !== this) throw new Error('This recording has already ended.')
      return await stopVoiceRecording()
    } finally {
      if (owner === this) owner = null
    }
  }
}
