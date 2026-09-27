import { Capacitor, registerPlugin } from '@capacitor/core'
import { Microphone } from '@mozartec/capacitor-microphone'

type GenericResponse = {
  value: boolean
}

type CurrentRecordingStatus = {
  status: 'NONE' | 'RECORDING' | 'PAUSED'
}

type RecordingData = {
  recordDataBase64?: string
  msDuration: number
  mimeType: string
  path?: string
}

type NativeVoiceRecorderPlugin = {
  canDeviceVoiceRecord: () => Promise<GenericResponse>
  requestAudioRecordingPermission: () => Promise<GenericResponse>
  hasAudioRecordingPermission: () => Promise<GenericResponse>
  startRecording: () => Promise<GenericResponse>
  stopRecording: () => Promise<RecordingData>
  pauseRecording: () => Promise<GenericResponse>
  resumeRecording: () => Promise<GenericResponse>
  getCurrentStatus: () => Promise<CurrentRecordingStatus>
}

type LegacyMicrophonePermissionStatus = {
  microphone: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied' | 'limited'
}

type LegacyMicrophoneRecordingData = {
  base64String?: string
  dataUrl?: string
  duration: number
  mimeType?: string
  path?: string
  webPath?: string
}

export type VoiceRecordingResult = {
  audioUrl: string
  base64: string
  durationMs: number
  mimeType: string
}

const NativeVoiceRecorder = registerPlugin<NativeVoiceRecorderPlugin>(
  'VoiceRecorder',
)

type WebRecorderState = {
  mediaRecorder: MediaRecorder | null
  stream: MediaStream | null
  chunks: Blob[]
  startedAt: number | null
  status: 'NONE' | 'RECORDING' | 'PAUSED'
}

const webRecorderState: WebRecorderState = {
  mediaRecorder: null,
  stream: null,
  chunks: [],
  startedAt: null,
  status: 'NONE',
}

function isWebPlatform() {
  return Capacitor.getPlatform() === 'web'
}

function ensureBrowserRecorderSupport() {
  if (typeof window === 'undefined') {
    throw new Error('Voice recording is unavailable in this environment.')
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error('This device cannot record audio.')
  }
}

function getPreferredWebMimeType() {
  const mimeTypes = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]

  return mimeTypes.find((mimeType) => MediaRecorder.isTypeSupported(mimeType))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read recorded audio.'))
        return
      }

      const [, base64 = ''] = result.split(',')
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read recorded audio.'))
    reader.readAsDataURL(blob)
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error) {
    return error
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code
  }

  return fallback
}

function isPluginUnavailableError(error: unknown) {
  const message = getErrorMessage(error, '').toLowerCase()

  return (
    message.includes('not implemented') ||
    message.includes('unimplemented') ||
    message.includes('plugin is not implemented') ||
    message.includes('plugin not implemented')
  )
}

async function canDeviceVoiceRecordWeb() {
  try {
    ensureBrowserRecorderSupport()
    return { value: true }
  } catch {
    return { value: false }
  }
}

async function hasAudioRecordingPermissionWeb() {
  try {
    ensureBrowserRecorderSupport()

    if (navigator.permissions?.query) {
      const result = await navigator.permissions.query({
        name: 'microphone' as PermissionName,
      })

      return { value: result.state === 'granted' }
    }
  } catch {}

  return { value: false }
}

async function requestAudioRecordingPermissionWeb() {
  ensureBrowserRecorderSupport()

  let stream: MediaStream | null = null

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return { value: true }
  } catch {
    return { value: false }
  } finally {
    stream?.getTracks().forEach((track) => track.stop())
  }
}

async function startRecordingWeb() {
  ensureBrowserRecorderSupport()

  if (webRecorderState.status === 'RECORDING') {
    throw new Error('A recording is already in progress.')
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const mimeType = getPreferredWebMimeType()
  const mediaRecorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream)

  webRecorderState.mediaRecorder = mediaRecorder
  webRecorderState.stream = stream
  webRecorderState.chunks = []
  webRecorderState.startedAt = Date.now()
  webRecorderState.status = 'RECORDING'

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      webRecorderState.chunks.push(event.data)
    }
  }

  mediaRecorder.onpause = () => {
    webRecorderState.status = 'PAUSED'
  }

  mediaRecorder.onresume = () => {
    webRecorderState.status = 'RECORDING'
  }

  mediaRecorder.onstop = () => {
    webRecorderState.stream?.getTracks().forEach((track) => track.stop())
    webRecorderState.stream = null
    webRecorderState.mediaRecorder = null
    if (webRecorderState.status !== 'NONE') {
      webRecorderState.status = 'NONE'
    }
  }

  mediaRecorder.start()
}

async function stopRecordingWeb(): Promise<VoiceRecordingResult> {
  const recorder = webRecorderState.mediaRecorder
  if (!recorder || webRecorderState.status === 'NONE') {
    throw new Error('No recording is in progress.')
  }

  const startedAt = webRecorderState.startedAt ?? Date.now()

  const blob = await new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => {
      reject(new Error('Failed to record audio.'))
    }

    recorder.onstop = () => {
      webRecorderState.stream?.getTracks().forEach((track) => track.stop())
      webRecorderState.stream = null

      const recordedBlob = new Blob(webRecorderState.chunks, {
        type: recorder.mimeType || 'audio/webm',
      })

      webRecorderState.mediaRecorder = null
      webRecorderState.status = 'NONE'
      resolve(recordedBlob)
    }

    recorder.stop()
  })

  const base64 = await blobToBase64(blob)
  webRecorderState.chunks = []
  webRecorderState.startedAt = null

  return {
    audioUrl: `data:${blob.type || 'audio/webm'};base64,${base64}`,
    base64,
    durationMs: Math.max(0, Date.now() - startedAt),
    mimeType: blob.type || 'audio/webm',
  }
}

async function pauseRecordingWeb() {
  if (!webRecorderState.mediaRecorder || webRecorderState.status !== 'RECORDING') {
    throw new Error('No recording is in progress.')
  }

  webRecorderState.mediaRecorder.pause()
}

async function resumeRecordingWeb() {
  if (!webRecorderState.mediaRecorder || webRecorderState.status !== 'PAUSED') {
    throw new Error('No paused recording is available.')
  }

  webRecorderState.mediaRecorder.resume()
}

async function getCurrentStatusWeb(): Promise<CurrentRecordingStatus> {
  return { status: webRecorderState.status }
}

async function canDeviceVoiceRecord() {
  if (isWebPlatform()) {
    return canDeviceVoiceRecordWeb()
  }

  try {
    return await NativeVoiceRecorder.canDeviceVoiceRecord()
  } catch (error) {
    if (!isPluginUnavailableError(error)) {
      throw error
    }

    return { value: true }
  }
}

async function hasAudioRecordingPermission() {
  if (isWebPlatform()) {
    return hasAudioRecordingPermissionWeb()
  }

  try {
    return await NativeVoiceRecorder.hasAudioRecordingPermission()
  } catch (error) {
    if (!isPluginUnavailableError(error)) {
      throw error
    }

    const status: LegacyMicrophonePermissionStatus =
      await Microphone.checkPermissions()

    return { value: status.microphone === 'granted' }
  }
}

async function requestAudioRecordingPermission() {
  if (isWebPlatform()) {
    return requestAudioRecordingPermissionWeb()
  }

  try {
    return await NativeVoiceRecorder.requestAudioRecordingPermission()
  } catch (error) {
    if (!isPluginUnavailableError(error)) {
      throw error
    }

    const status: LegacyMicrophonePermissionStatus =
      await Microphone.requestPermissions()

    return { value: status.microphone === 'granted' }
  }
}

export async function hasVoiceRecordingPermission(): Promise<boolean> {
  return (await hasAudioRecordingPermission()).value
}

export async function ensureVoiceRecordingPermission() {
  const deviceSupport = await canDeviceVoiceRecord()
  if (!deviceSupport.value) {
    throw new Error('This device cannot record audio.')
  }

  const permissionStatus = await hasAudioRecordingPermission()
  if (permissionStatus.value) {
    return true
  }

  const granted = await requestAudioRecordingPermission()
  if (!granted.value) {
    throw new Error('Microphone permission was denied.')
  }

  return true
}

export async function startVoiceRecording() {
  try {
    await ensureVoiceRecordingPermission()

    if (isWebPlatform()) {
      await startRecordingWeb()
      return
    }

    try {
      await NativeVoiceRecorder.startRecording()
    } catch (error) {
      if (!isPluginUnavailableError(error)) {
        throw error
      }

      await Microphone.startRecording()
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to start recording.'))
  }
}

export async function stopVoiceRecording(): Promise<VoiceRecordingResult> {
  try {
    if (isWebPlatform()) {
      return await stopRecordingWeb()
    }

    try {
      const result = await NativeVoiceRecorder.stopRecording()
      const base64 = result.recordDataBase64

      if (!base64) {
        throw new Error(
          'The recording plugin returned a file path instead of inline audio data.',
        )
      }

      return {
        audioUrl: `data:${result.mimeType};base64,${base64}`,
        base64,
        durationMs: result.msDuration,
        mimeType: result.mimeType,
      }
    } catch (error) {
      if (!isPluginUnavailableError(error)) {
        throw error
      }

      const result: LegacyMicrophoneRecordingData = await Microphone.stopRecording()
      const base64 = result.base64String
      const mimeType = result.mimeType || 'audio/aac'
      const audioUrl = result.dataUrl || (base64 ? `data:${mimeType};base64,${base64}` : '')

      if (!base64 || !audioUrl) {
        throw new Error('The microphone plugin did not return usable audio data.')
      }

      return {
        audioUrl,
        base64,
        durationMs: result.duration,
        mimeType,
      }
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to stop recording.'))
  }
}

export async function getVoiceRecordingStatus() {
  try {
    if (isWebPlatform()) {
      return await getCurrentStatusWeb()
    }

    try {
      return await NativeVoiceRecorder.getCurrentStatus()
    } catch (error) {
      if (!isPluginUnavailableError(error)) {
        throw error
      }

      return { status: 'NONE' as const }
    }
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to get recording status.'))
  }
}

export async function pauseVoiceRecording() {
  try {
    if (isWebPlatform()) {
      await pauseRecordingWeb()
      return
    }

    await NativeVoiceRecorder.pauseRecording()
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to pause recording.'))
  }
}

export async function resumeVoiceRecording() {
  try {
    if (isWebPlatform()) {
      await resumeRecordingWeb()
      return
    }

    await NativeVoiceRecorder.resumeRecording()
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to resume recording.'))
  }
}
