import type { VoiceRecordingResult } from '@/plugins/capacitor/plugins/voice-recorder.plugin'

export const AUDIO_MAX_BYTES = 12 * 1024 * 1024
export const RECORDING_MAX_MS = 5 * 60_000
export const AUDIO_ACCEPT = 'audio/*,.m4a,.aac,.mp3,.wav,.webm,.ogg,.flac'

const fileTypes: Record<string, string> = {
  aac: 'audio/aac',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  mp3: 'audio/mpeg',
  mp4: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  webm: 'audio/webm',
}

export function audioFile(file: File): Blob {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const type = fileTypes[extension] ?? file.type
  if (!type.startsWith('audio/')) throw new Error('Choose an audio recording.')
  const blob = file.slice(0, file.size, type)
  validateAudioSize(blob)
  return blob
}

export function validateAudioSize(blob: Blob): void {
  if (!blob.size) throw new Error('This recording is empty. Please try again.')
  if (blob.size > AUDIO_MAX_BYTES)
    throw new Error('Audio must be 12 MB or smaller.')
}

export function recordedAudio(recording: VoiceRecordingResult): Blob {
  const raw = atob(recording.base64)
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0))
  const blob = new Blob([bytes], { type: recording.mimeType })
  validateAudioSize(blob)
  return blob
}

export function appendTranscript(value: string, transcript: string): string {
  const words = transcript.trim()
  if (!words) return value
  return value.trimEnd() ? `${value.trimEnd()}\n\n${words}` : words
}
