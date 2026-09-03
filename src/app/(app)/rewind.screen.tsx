import {
  RiEmotionHappyLine,
  RiFlashlightLine,
  RiHistoryLine,
  RiMoonClearLine,
  RiPauseLine,
  RiPlayLine,
  RiRefreshLine,
  RiSettings3Line,
  RiStopCircleLine,
  RiWaterFlashLine,
} from '@remixicon/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isAxiosError } from 'axios'
import { motion } from 'framer-motion'
import { Mirage } from 'ldrs/react'
import 'ldrs/react/Mirage.css'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { BottomNotch } from '@/components/common/notch.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { UserCheckmark } from '@/components/user/checkmark.component'
import ENV from '@/env'
import { useRewindRoutine } from '@/hooks/use-rewind.hook'
import { ensureVoiceRecordingPermission } from '@/plugins/capacitor/plugins/voice-recorder.plugin'
import { useAuth } from '@/providers/auth.provider'
import { useToast } from '@/providers/toast.provider'
import { authAPI } from '@/shared/api/auth.api'
import { rewindAPI } from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import {
  createAdaptiveGainController,
  floatTo16BitPcmBase64,
  resampleFloat32Audio,
} from '@/shared/rewind/audio-processing'
import { decodePcmAudioChunk } from '@/shared/rewind/pcm-audio'
import {
  createRewindCaptureWorkletSource,
  getRewindCaptureFrameSize,
  REWIND_CAPTURE_WORKLET_NAME,
} from '@/shared/rewind/rewind-audio-worklet'
import { shouldAcknowledgeRewindClosing } from '@/shared/rewind/rewind-closing.util'
import { shouldAutoReconnectRewindSocket } from '@/shared/rewind/rewind-live-reconnect'
import {
  getRewindPersona,
  REWIND_PERSONAS,
  type RewindPersona,
  type RewindPersonaIcon,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import { adjustColor, cn } from '@/shared/utils/helpers.util'

const REWIND_PERSONA_ICONS: Record<
  RewindPersonaIcon,
  typeof RiEmotionHappyLine
> = {
  emotion: RiEmotionHappyLine,
  flashlight: RiFlashlightLine,
  moon: RiMoonClearLine,
  water: RiWaterFlashLine,
}

type RewindConversationStage =
  | 'ARRIVING'
  | 'UNPACKING'
  | 'MAKING_MEANING'
  | 'CONNECTING_PATTERNS'
  | 'CLOSING'

type RewindSocketMessage =
  | {
      type: 'ready'
      sessionId?: string
      sessionDateKey?: string
      restored?: boolean
      previousSession?: RewindSessionSnapshot | null
    }
  | { type: 'text'; content: string }
  | { type: 'audio'; data: string; mimeType: string }
  | { type: 'input_transcription'; content: string }
  | { type: 'output_transcription'; content: string }
  | {
      type: 'conversation_state'
      content: string
      stage: RewindConversationStage
    }
  | {
      type: 'finalization_progress'
      stage: 'saving_conversation' | 'noticing_patterns' | 'saving_reflection'
    }
  | { type: 'reconnected' }
  | { type: 'reconnecting' }
  | { type: 'closing_started' }
  | { type: 'closing_turn_complete' }
  | { type: 'closing_cancelled' }
  | { type: 'closing_save_failed'; message: string }
  | { type: 'turn_complete' }
  | { type: 'interrupted' }
  | { type: 'session_paused'; sessionId?: string }
  | { type: 'session_missed'; sessionId?: string }
  | { type: 'session_unavailable'; sessionId?: string; message: string }
  | {
      type: 'session_ended'
      emotionalInsight?: string | null
      sessionId?: string
      summary: string
    }
  | { type: 'open_history' }
  | { type: 'error'; message: string }
  | { type: 'debug'; content: unknown }

type RewindSessionSnapshot = {
  sessionId: string
  sessionDateKey: string
  completed: boolean
  summary: string
  updatedAt: number
}

function getPausedRewindSessionStorageKey(personaId: RewindPersonaId): string {
  return `rewind:paused-session:${personaId}`
}

function getPausedRewindSessionId(personaId: RewindPersonaId): string | null {
  if (typeof window === 'undefined') return null

  return localStorage.getItem(getPausedRewindSessionStorageKey(personaId))
}

function savePausedRewindSessionId(
  personaId: RewindPersonaId,
  sessionId: string,
): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(getPausedRewindSessionStorageKey(personaId), sessionId)
}

function clearPausedRewindSessionId(personaId: RewindPersonaId): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(getPausedRewindSessionStorageKey(personaId))
}

type LegacyNavigator = Navigator & {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure?: (error: unknown) => void,
  ) => void
  webkitGetUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    failure?: (error: unknown) => void,
  ) => void
}

type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

type RewindFinalizationStage =
  | 'saving_conversation'
  | 'noticing_patterns'
  | 'saving_reflection'

const REWIND_FINALIZATION_LABELS: Record<RewindFinalizationStage, string> = {
  noticing_patterns: 'Noticing patterns',
  saving_conversation: 'Saving conversation',
  saving_reflection: 'Building your reflection',
}

const REWIND_CONVERSATION_STAGE_LABELS: Record<
  RewindConversationStage,
  string
> = {
  ARRIVING: 'Settling in',
  CLOSING: 'Closing reflection',
  CONNECTING_PATTERNS: 'Connecting patterns',
  MAKING_MEANING: 'Making meaning',
  UNPACKING: 'Unpacking',
}

function getAudioContextConstructor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as AudioContextWindow).webkitAudioContext ??
    null
  )
}

function getMutationErrorMessage(error: unknown): string {
  if (isAxiosError<{ msg?: string }>(error)) {
    return error.response?.data?.msg ?? error.message
  }

  return error instanceof Error
    ? error.message
    : 'Failed to save Rewind partner'
}

async function getRealtimeMicrophoneStream(
  constraints: MediaStreamConstraints,
): Promise<MediaStream> {
  if (typeof navigator === 'undefined') {
    throw new Error('Microphone access is unavailable in this environment.')
  }

  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    throw new Error(
      'Rewind live mic is unavailable because the app is running from an insecure HTTP origin. Use HTTPS or a bundled Capacitor build without server.url.',
    )
  }

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia(constraints)
  }

  const legacyNavigator = navigator as LegacyNavigator
  const legacyGetUserMedia =
    legacyNavigator.getUserMedia || legacyNavigator.webkitGetUserMedia

  if (!legacyGetUserMedia) {
    throw new Error(
      'This runtime does not expose a microphone stream API for Rewind live audio.',
    )
  }

  return new Promise((resolve, reject) => {
    legacyGetUserMedia.call(legacyNavigator, constraints, resolve, reject)
  })
}

function PersonaThumbnail({
  persona,
  onSelect,
  selected,
  disabled,
}: {
  persona: RewindPersona
  onSelect: (id: RewindPersonaId) => void
  selected: boolean
  disabled?: boolean
}): ReactElement {
  const $color = persona.color
  const color = adjustColor($color, { lightness: -10, saturation: 0 })
  const PersonaIcon = REWIND_PERSONA_ICONS[persona.icon]

  return (
    <Pressable
      style={
        {
          '--tw-themecolor': color,
        } as CSSProperties
      }
      disabled={disabled}
      onPress={() => onSelect(persona.id)}
      accessibilityLabel={`Choose ${persona.name}. ${persona.perspective}`}
      className={cn(
        'relative  shrink-0 items-center justify-center mt-2 aspect-square overflow-hidden rounded-xl bg-cardx',
        selected &&
          'ring-2 ring-[var(--tw-themecolor)] ring-offset-2 ring-offset-cardd',
      )}
    >
      <img
        src={persona.avatar}
        alt=""
        className="absolute inset-0 size-full object-cover"
      />
      <View className="absolute inset-0 opacity-70 bg-[var(--tw-themecolor)]" />
      <View className="z-10 items-center justify-center mb-3 opacity-40">
        <PersonaIcon size={34} color="white" />
      </View>
      <Text className="absolute bottom-1.5 z-10 font-bbh text-[10px] font-bold text-white">
        {persona.name}
      </Text>
    </Pressable>
  )
}

function PersonaArtwork({
  persona,
  onChoose,
  disabled,
}: {
  persona: RewindPersona
  onChoose: () => void
  disabled?: boolean
}): ReactElement {
  const color = adjustColor(persona.color, {
    lightness: -10,
    saturation: -20,
  })
  const darkColor = adjustColor(color, { lightness: -25, saturation: -20 })

  return (
    <View
      style={
        {
          '--persona-color': color,
          '--persona-dark-color': darkColor,
        } as CSSProperties
      }
      className="relative w-full overflow-hidden rounded-3xl bg-cardx"
    >
      <View
        className="absolute opacity-30 top-10 inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 15%, var(--persona-color), transparent 68%)',
          maskImage:
            'linear-gradient(to bottom, black 0%, black 55%, transparent 100%)',
        }}
      />
      <View
        className="absolute inset-2 rounded-3xl border-2 border-[var(--persona-color)] opacity-70"
        style={{
          maskImage:
            'linear-gradient(to bottom, transparent 0%, black 45%, transparent 100%)',
        }}
      />
      <View className="relative min-h-[290px] items-center justify-center px-6 py-8">
        <View className="mb-5 size-44 overflow-hidden rounded-full border-4 border-[var(--persona-color)] shadow-lg">
          <img
            src={persona.avatar}
            alt={`${persona.name} avatar`}
            className="size-full object-cover"
          />
        </View>
        <Text className="font-display relative z-10 text-2xl font-extrabold text-white">
          {persona.name}
        </Text>
        <Text className="mt-2 !text-center relative z-10 max-w-[70%] text-center font-bbh text-sm leading-5 text-card-lighter-3">
          {persona.name} {persona.perspective.toLowerCase()}
        </Text>
        <Pressable
          onPress={onChoose}
          disabled={disabled}
          accessibilityLabel={`Choose ${persona.name} as your Rewind partner`}
          className="mt-6 min-h-11 min-w-[190px] items-center justify-center rounded-full bg-white px-6"
        >
          <Text className="font-bbh font-bold text-cardd">
            {disabled ? 'Saving...' : `Choose ${persona.name}`}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default function RewindScreen(): ReactElement {
  const {
    user,
    refreshSession,
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth()
  const routineQuery = useRewindRoutine()
  const toast = useToast()
  const [personaId, setPersonaId] = useState<RewindPersonaId | null>(null)
  const [previewPersonaId, setPreviewPersonaId] =
    useState<RewindPersonaId>('ella')
  const [resolvedPersonaUserId, setResolvedPersonaUserId] = useState<
    string | null
  >(null)
  const [statusText, setStatusText] = useState('Idle')
  const [isConversationPaused, setIsConversationPaused] = useState(false)
  const [rewindSessionDateKey, setRewindSessionDateKey] = useState<
    string | null
  >(null)
  const [isSessionRestored, setIsSessionRestored] = useState(false)
  const [isFinishingSession, setIsFinishingSession] = useState(false)
  const [finalizationStage, setFinalizationStage] =
    useState<RewindFinalizationStage | null>(null)
  const [conversationStateNote, setConversationStateNote] = useState<
    string | null
  >(null)
  const [conversationStage, setConversationStage] =
    useState<RewindConversationStage | null>(null)
  const [previousSession, setPreviousSession] =
    useState<RewindSessionSnapshot | null>(null)

  const liveSessionRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const inputAudioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<AudioNode | null>(null)
  const inputPipelineNodesRef = useRef<AudioNode[]>([])
  const gainControllerRef = useRef(createAdaptiveGainController())
  const playbackContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<Array<{ data: string; mimeType: string }>>([])
  const activeAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
  const isPlayingAudioQueueRef = useRef(false)
  const nextStartTimeRef = useRef(0)
  const playbackGenerationRef = useRef(0)
  const isConnectingRef = useRef(false)
  const isConversationPausedRef = useRef(false)
  const isSessionPausedByToolRef = useRef(false)
  const isSessionCompleteRef = useRef(false)
  const isFinishingSessionRef = useRef(false)
  const isClosingRef = useRef(false)
  const closingTurnCompleteRef = useRef(false)
  const closingPlaybackAckSentRef = useRef(false)
  const closingSaveRetryRef = useRef(false)
  const shouldReconnectRef = useRef(false)
  const disconnectNoticeShownRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startSessionRef = useRef<(() => Promise<void>) | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const openRoutineSettings = useCallback(() => {
    void navigate({
      search: { from: 'rewind' },
      to: '/app/rewind-routine',
    })
  }, [navigate])

  useEffect(() => {
    isConversationPausedRef.current = isConversationPaused
  }, [isConversationPaused])

  const persistPersonaMutation = useMutation({
    mutationFn: async (nextPersona: RewindPersonaId | null) => {
      await authAPI.updateProfile({
        rewindPersona: nextPersona,
      })
    },
    onSuccess: async () => {
      await refreshSession()
    },
    onError: (error: unknown) => {
      toast.error(getMutationErrorMessage(error))
    },
  })

  useEffect(() => {
    if (!user) return

    setPersonaId((user.rewindPersona as RewindPersonaId | undefined) ?? null)
    setResolvedPersonaUserId(user.id)
  }, [user?.id, user?.rewindPersona])

  useEffect(() => {
    if (!personaId) return
    setRewindSessionDateKey(null)
    setConversationStateNote(null)
    setConversationStage(null)
    setPreviousSession(null)
    setIsSessionRestored(false)
    setIsFinishingSession(false)
    setFinalizationStage(null)
    isFinishingSessionRef.current = false
    isSessionCompleteRef.current = false
    setStatusText('Ready')
  }, [personaId])

  const persona = useMemo(() => {
    if (!personaId) return null
    return getRewindPersona(personaId)
  }, [personaId])

  const personaTheme = useMemo(() => {
    if (!persona) return null
    const $color = persona.color
    const color = adjustColor($color, { lightness: -10, saturation: -20 })
    const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })
    return { color, darkColor }
  }, [persona])

  const selectPersona = async (nextPersona: RewindPersonaId) => {
    await primePlaybackContext()
    setPersonaId(nextPersona)
    await persistPersonaMutation.mutateAsync(nextPersona)
  }

  const previewPersona = useMemo(
    () => getRewindPersona(previewPersonaId),
    [previewPersonaId],
  )

  const clearPersona = async () => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    liveSessionRef.current?.close()
    liveSessionRef.current = null
    cleanupAudioPipeline()
    playbackGenerationRef.current += 1
    audioQueueRef.current = []
    for (const source of activeAudioSourcesRef.current) {
      try {
        source.stop()
      } catch {}
    }
    activeAudioSourcesRef.current.clear()
    isPlayingAudioQueueRef.current = false
    nextStartTimeRef.current = 0
    setIsConversationPaused(false)
    setPersonaId(null)
    setRewindSessionDateKey(null)
    setConversationStateNote(null)
    setConversationStage(null)
    setPreviousSession(null)
    setIsSessionRestored(false)
    setIsFinishingSession(false)
    setFinalizationStage(null)
    isFinishingSessionRef.current = false
    isSessionCompleteRef.current = false
    setStatusText('Idle')
    await persistPersonaMutation.mutateAsync(null)
  }

  const primePlaybackContext = useCallback(async () => {
    if (typeof window === 'undefined') return

    const AudioContextClass = getAudioContextConstructor()
    if (!AudioContextClass) return

    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContextClass({
        latencyHint: 'interactive',
      })
    }

    if (playbackContextRef.current.state === 'suspended') {
      try {
        await playbackContextRef.current.resume()
      } catch {
        setStatusText('Playback unavailable')
      }
    }
  }, [])

  const cleanupAudioPipeline = useCallback(() => {
    for (const node of inputPipelineNodesRef.current) {
      try {
        node.disconnect()
      } catch {}
    }
    inputPipelineNodesRef.current = []

    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
      } catch {}
      processorRef.current = null
    }

    gainControllerRef.current.reset()

    if (
      inputAudioContextRef.current &&
      inputAudioContextRef.current.state !== 'closed'
    ) {
      inputAudioContextRef.current.close().catch(() => {})
      inputAudioContextRef.current = null
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
  }, [])

  const clearPlayback = useCallback((): void => {
    playbackGenerationRef.current += 1
    audioQueueRef.current = []
    isPlayingAudioQueueRef.current = false
    nextStartTimeRef.current = 0

    for (const source of activeAudioSourcesRef.current) {
      try {
        source.stop()
        source.disconnect()
      } catch {}
    }
    activeAudioSourcesRef.current.clear()
  }, [])

  const sendClosingPlaybackComplete = useCallback((): void => {
    if (
      !shouldAcknowledgeRewindClosing({
        acknowledgementSent: closingPlaybackAckSentRef.current,
        activeSourceCount: activeAudioSourcesRef.current.size,
        closing: isClosingRef.current,
        playingQueue: isPlayingAudioQueueRef.current,
        queuedChunkCount: audioQueueRef.current.length,
        turnComplete: closingTurnCompleteRef.current,
      })
    ) {
      return
    }
    const socket = liveSessionRef.current
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    closingPlaybackAckSentRef.current = true
    socket.send(JSON.stringify({ type: 'closing_playback_complete' }))
    setStatusText('Saving reflection')
  }, [])

  const playNextAudioChunk = useCallback(async () => {
    if (isPlayingAudioQueueRef.current) return
    if (isConversationPausedRef.current) return
    if (audioQueueRef.current.length === 0) return

    const generation = playbackGenerationRef.current
    isPlayingAudioQueueRef.current = true

    try {
      if (!playbackContextRef.current) {
        const AudioContextClass = getAudioContextConstructor()
        if (!AudioContextClass) {
          throw new Error('Audio playback is unavailable')
        }
        playbackContextRef.current = new AudioContextClass({
          latencyHint: 'interactive',
        })
      }

      const ctx = playbackContextRef.current
      if (ctx.state === 'suspended') await ctx.resume()

      while (
        generation === playbackGenerationRef.current &&
        !isConversationPausedRef.current &&
        audioQueueRef.current.length > 0
      ) {
        const chunk = audioQueueRef.current.shift()
        if (!chunk) break

        const decoded = decodePcmAudioChunk(chunk.data, chunk.mimeType)
        if (decoded.samples.length === 0) continue

        const buffer = ctx.createBuffer(
          1,
          decoded.samples.length,
          decoded.sampleRate,
        )
        buffer.getChannelData(0).set(decoded.samples)

        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        activeAudioSourcesRef.current.add(source)

        const startAt = Math.max(
          nextStartTimeRef.current,
          ctx.currentTime + 0.035,
        )
        nextStartTimeRef.current = startAt + buffer.duration
        source.onended = () => {
          activeAudioSourcesRef.current.delete(source)
          source.disconnect()
          if (
            generation === playbackGenerationRef.current &&
            !isConversationPausedRef.current &&
            activeAudioSourcesRef.current.size === 0 &&
            audioQueueRef.current.length === 0
          ) {
            setStatusText('Listening')
            sendClosingPlaybackComplete()
          }
        }
        source.start(startAt)
        setStatusText('Speaking')
      }
    } catch {
      setStatusText('Playback interrupted')
    } finally {
      isPlayingAudioQueueRef.current = false
      if (
        generation === playbackGenerationRef.current &&
        !isConversationPausedRef.current &&
        audioQueueRef.current.length > 0
      ) {
        queueMicrotask(() => void playNextAudioChunk())
      }
    }
  }, [sendClosingPlaybackComplete])

  const connectMicrophone = useCallback(
    async (ws: WebSocket) => {
      try {
        await primePlaybackContext()
        setStatusText('Requesting mic')
        await ensureVoiceRecordingPermission()

        const stream = await getRealtimeMicrophoneStream({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: { ideal: true },
            noiseSuppression: { ideal: true },
            autoGainControl: { ideal: true },
          },
        })
        mediaStreamRef.current = stream

        const AudioContextClass = getAudioContextConstructor()
        if (!AudioContextClass) {
          throw new Error('Live audio is unavailable on this device.')
        }
        const context = new AudioContextClass({ latencyHint: 'interactive' })
        inputAudioContextRef.current = context
        if (context.state === 'suspended') await context.resume()

        const source = context.createMediaStreamSource(stream)
        const inputGain = context.createGain()
        inputGain.gain.value = 1.35
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -38
        compressor.knee.value = 18
        compressor.ratio.value = 2.5
        compressor.attack.value = 0.003
        compressor.release.value = 0.25
        const silentSink = context.createGain()
        silentSink.gain.value = 0
        const sendAudio = (inputData: Float32Array): void => {
          if (isConversationPausedRef.current) return
          if (ws.readyState !== WebSocket.OPEN) return
          const resampled = resampleFloat32Audio(inputData, context.sampleRate)
          const processed = gainControllerRef.current.process(resampled)
          const data = floatTo16BitPcmBase64(processed)
          ws.send(
            JSON.stringify({
              type: 'realtime_audio',
              mimeType: 'audio/pcm;rate=16000',
              data,
            }),
          )
        }

        let processor: AudioNode | null = null
        if (context.audioWorklet) {
          const workletUrl = URL.createObjectURL(
            new Blob(
              [
                createRewindCaptureWorkletSource(
                  getRewindCaptureFrameSize(context.sampleRate),
                ),
              ],
              {
                type: 'text/javascript',
              },
            ),
          )
          try {
            await context.audioWorklet.addModule(workletUrl)
            const worklet = new AudioWorkletNode(
              context,
              REWIND_CAPTURE_WORKLET_NAME,
            )
            worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
              sendAudio(event.data)
            }
            processor = worklet
          } catch {
            // Some older WebViews expose AudioWorklet but cannot load dynamic modules.
          } finally {
            URL.revokeObjectURL(workletUrl)
          }
        }

        if (!processor) {
          const fallbackProcessor = context.createScriptProcessor(4096, 1, 1)
          fallbackProcessor.onaudioprocess = (event) => {
            sendAudio(event.inputBuffer.getChannelData(0))
          }
          processor = fallbackProcessor
        }
        processorRef.current = processor
        inputPipelineNodesRef.current = [
          source,
          inputGain,
          compressor,
          processor,
          silentSink,
        ]

        source.connect(inputGain)
        inputGain.connect(compressor)
        compressor.connect(processor)
        // Keep the capture graph alive without ever routing microphone audio to speakers.
        processor.connect(silentSink)
        silentSink.connect(context.destination)

        if (!isConversationPausedRef.current) {
          setStatusText('Listening')
        }
      } catch (error) {
        cleanupAudioPipeline()
        toast.error(
          error instanceof Error ? error.message : 'Microphone access denied',
        )
        setStatusText('Mic blocked')
      }
    },
    [cleanupAudioPipeline, primePlaybackContext, toast],
  )

  const pauseConversation = useCallback(async () => {
    setIsConversationPaused(true)
    if (liveSessionRef.current?.readyState === WebSocket.OPEN) {
      liveSessionRef.current.send(JSON.stringify({ type: 'audio_stream_end' }))
    }
    clearPlayback()

    if (
      playbackContextRef.current &&
      playbackContextRef.current.state === 'running'
    ) {
      try {
        await playbackContextRef.current.suspend()
      } catch {
        setStatusText('Pause unavailable')
      }
    }

    setStatusText('Paused')
  }, [clearPlayback])

  const resumeConversation = useCallback(async () => {
    setIsConversationPaused(false)

    if (
      playbackContextRef.current &&
      playbackContextRef.current.state === 'suspended'
    ) {
      try {
        await playbackContextRef.current.resume()
      } catch {
        setStatusText('Playback unavailable')
      }
    }

    setStatusText(
      liveSessionRef.current?.readyState === WebSocket.OPEN
        ? 'Listening'
        : 'Connecting',
    )
  }, [])

  const togglePauseConversation = useCallback(async () => {
    if (
      !liveSessionRef.current ||
      liveSessionRef.current.readyState !== WebSocket.OPEN
    ) {
      return
    }

    if (isConversationPausedRef.current) {
      await resumeConversation()
      return
    }

    await pauseConversation()
  }, [pauseConversation, resumeConversation])

  const finishSession = useCallback(() => {
    const liveSession = liveSessionRef.current
    if (
      !liveSession ||
      liveSession.readyState !== WebSocket.OPEN ||
      isFinishingSession
    ) {
      return
    }

    isClosingRef.current = true
    closingTurnCompleteRef.current = false
    closingPlaybackAckSentRef.current = false
    isFinishingSessionRef.current = true
    setIsFinishingSession(true)
    setStatusText('Wrapping up')
    cleanupAudioPipeline()
    liveSession.send(
      JSON.stringify({
        type: closingSaveRetryRef.current
          ? 'retry_finalization'
          : 'finish_session',
      }),
    )
    closingSaveRetryRef.current = false
  }, [cleanupAudioPipeline, isFinishingSession])

  useEffect(() => {
    if (!persona) {
      liveSessionRef.current?.close()
      liveSessionRef.current = null
      cleanupAudioPipeline()
      clearPlayback()
      setIsConversationPaused(false)
      setIsFinishingSession(false)
      setFinalizationStage(null)
      isFinishingSessionRef.current = false
      isSessionCompleteRef.current = false
      setStatusText('Idle')
      return
    }

    return () => {
      shouldReconnectRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      liveSessionRef.current?.close()
      liveSessionRef.current = null
      cleanupAudioPipeline()
      clearPlayback()
    }
  }, [cleanupAudioPipeline, clearPlayback, persona])

  const startSession = useCallback(async () => {
    if (!persona) return
    if (isConnectingRef.current) return
    if (liveSessionRef.current?.readyState === WebSocket.OPEN) return
    if (!routineQuery.data?.routine) {
      openRoutineSettings()
      return
    }
    if (!routineQuery.data.currentSession) {
      setStatusText('Not scheduled now')
      return
    }

    isConnectingRef.current = true
    shouldReconnectRef.current = true
    isSessionPausedByToolRef.current = false
    disconnectNoticeShownRef.current = false
    try {
      setIsConversationPaused(false)
      setIsFinishingSession(false)
      setFinalizationStage(null)
      isFinishingSessionRef.current = false
      isSessionCompleteRef.current = false
      setStatusText('Connecting')

      const liveToken = await rewindAPI.createLiveToken(
        persona.id,
        getPausedRewindSessionId(persona.id),
      )
      const apiUrl = ENV.API_BASE_URL.replace(/\/+$/, '')
      const wsUrl = `${apiUrl.replace(/^http/, 'ws')}${liveToken.data.wsUrl}`
      setRewindSessionDateKey(liveToken.data.sessionDateKey ?? null)

      const ws = new WebSocket(wsUrl)
      liveSessionRef.current = ws

      ws.onopen = async () => {
        isConnectingRef.current = false
        setStatusText('Connected')
        await connectMicrophone(ws)
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RewindSocketMessage

          if (payload.type === 'ready') {
            reconnectAttemptsRef.current = 0
            isSessionPausedByToolRef.current = false
            setRewindSessionDateKey(payload.sessionDateKey ?? null)
            setIsSessionRestored(Boolean(payload.restored))
            setPreviousSession(payload.previousSession ?? null)
            if (isConversationPausedRef.current) return
            return
          }

          if (payload.type === 'text') {
            return
          }

          if (payload.type === 'audio') {
            if (isConversationPausedRef.current) return
            audioQueueRef.current.push({
              data: payload.data,
              mimeType: payload.mimeType,
            })
            if (!isPlayingAudioQueueRef.current) {
              void playNextAudioChunk()
            }
            return
          }

          if (payload.type === 'input_transcription') {
            if (isConversationPausedRef.current) return
            setStatusText('Listening')
            return
          }

          if (payload.type === 'output_transcription') {
            if (isConversationPausedRef.current) return
            setStatusText('Speaking')
            return
          }

          if (payload.type === 'conversation_state') {
            if (isConversationPausedRef.current) return
            const nextConversationState = payload.content.trim()
            if (nextConversationState) {
              setConversationStateNote(nextConversationState)
              setConversationStage(payload.stage)
            }
            return
          }

          if (payload.type === 'finalization_progress') {
            isFinishingSessionRef.current = true
            setIsFinishingSession(true)
            setFinalizationStage(payload.stage)
            setStatusText(REWIND_FINALIZATION_LABELS[payload.stage])
            return
          }

          if (payload.type === 'closing_started') {
            isClosingRef.current = true
            closingTurnCompleteRef.current = false
            closingPlaybackAckSentRef.current = false
            closingSaveRetryRef.current = false
            isFinishingSessionRef.current = true
            setIsFinishingSession(true)
            setConversationStage('CLOSING')
            setStatusText('Wrapping up')
            cleanupAudioPipeline()
            return
          }

          if (payload.type === 'closing_turn_complete') {
            closingTurnCompleteRef.current = true
            setStatusText('Finishing closing message')
            sendClosingPlaybackComplete()
            return
          }

          if (payload.type === 'closing_cancelled') {
            isClosingRef.current = false
            closingTurnCompleteRef.current = false
            closingPlaybackAckSentRef.current = false
            isFinishingSessionRef.current = false
            setIsFinishingSession(false)
            setConversationStage('UNPACKING')
            setStatusText('Listening')
            void connectMicrophone(ws)
            return
          }

          if (payload.type === 'closing_save_failed') {
            isClosingRef.current = false
            closingTurnCompleteRef.current = false
            closingPlaybackAckSentRef.current = false
            closingSaveRetryRef.current = true
            isFinishingSessionRef.current = false
            setIsFinishingSession(false)
            setFinalizationStage(null)
            setStatusText('Tap Finish to retry saving')
            toast.error(payload.message)
            return
          }

          if (payload.type === 'reconnecting') {
            setStatusText('Reconnecting')
            return
          }

          if (payload.type === 'reconnected') {
            if (!isConversationPausedRef.current) {
              setStatusText('Listening')
            }
            return
          }

          if (payload.type === 'turn_complete') {
            if (isConversationPausedRef.current) return
            setStatusText('Listening')
            return
          }

          if (payload.type === 'interrupted') {
            clearPlayback()
            setStatusText('Listening')
            return
          }

          if (payload.type === 'session_ended') {
            isSessionCompleteRef.current = true
            isClosingRef.current = false
            shouldReconnectRef.current = false
            clearPausedRewindSessionId(persona.id)
            setIsFinishingSession(false)
            setFinalizationStage(null)
            isFinishingSessionRef.current = false
            setStatusText('Completed')
            clearPlayback()
            cleanupAudioPipeline()
            toast.success('Your Rewind summary is ready')
            liveSessionRef.current?.close(1000, 'Session completed')
            void queryClient
              .invalidateQueries({
                queryKey: rewindQueryKeys.all,
                refetchType: 'all',
              })
              .finally(() => {
                void routineQuery.refetch()
                if (payload.sessionId) {
                  navigate({
                    params: { sessionId: payload.sessionId },
                    search: { from: 'rewind' },
                    to: '/app/r/$sessionId',
                  })
                  return
                }
                navigate({ to: '/app/rewind-history' })
              })
            return
          }

          if (payload.type === 'session_paused') {
            isSessionPausedByToolRef.current = true
            isConversationPausedRef.current = true
            shouldReconnectRef.current = false
            setIsConversationPaused(true)
            setIsFinishingSession(false)
            setFinalizationStage(null)
            isFinishingSessionRef.current = false
            setStatusText('Paused')
            if (payload.sessionId) {
              savePausedRewindSessionId(persona.id, payload.sessionId)
            }
            cleanupAudioPipeline()
            toast.success('Rewind paused. It will continue when you return.')
            return
          }

          if (
            payload.type === 'session_missed' ||
            payload.type === 'session_unavailable'
          ) {
            const completedSpokenClose =
              payload.type === 'session_missed' && isClosingRef.current
            isSessionCompleteRef.current = true
            isClosingRef.current = false
            shouldReconnectRef.current = false
            clearPausedRewindSessionId(persona.id)
            setIsFinishingSession(false)
            setFinalizationStage(null)
            isFinishingSessionRef.current = false
            setStatusText(
              payload.type === 'session_missed'
                ? 'Window closed'
                : 'Unavailable',
            )
            cleanupAudioPipeline()
            void routineQuery.refetch()
            liveSessionRef.current?.close(1000, 'Rewind window closed')
            if (completedSpokenClose && payload.sessionId) {
              void navigate({
                params: { sessionId: payload.sessionId },
                search: { from: 'rewind' },
                to: '/app/r/$sessionId',
              })
            }
            return
          }

          if (payload.type === 'open_history') {
            navigate({ to: '/app/rewind-history-sessions' })
            return
          }

          if (payload.type === 'error') {
            disconnectNoticeShownRef.current = true
            if (
              isFinishingSessionRef.current &&
              ws.readyState === WebSocket.OPEN
            ) {
              isFinishingSessionRef.current = false
              isConversationPausedRef.current = false
              setIsFinishingSession(false)
              setFinalizationStage(null)
              setIsConversationPaused(false)
              setStatusText('Listening')
              void connectMicrophone(ws)
            } else {
              setStatusText('Error')
            }
            toast.error(payload.message)
          }
        } catch {
          setStatusText('Invalid response')
        }
      }

      ws.onerror = () => {
        isConnectingRef.current = false
        setStatusText('Error')
      }

      ws.onclose = (event) => {
        isConnectingRef.current = false
        clearPlayback()
        cleanupAudioPipeline()
        if (liveSessionRef.current === ws) {
          liveSessionRef.current = null
        }
        if (isSessionPausedByToolRef.current) {
          shouldReconnectRef.current = false
          setStatusText('Paused')
          return
        }
        if (!isSessionCompleteRef.current) {
          if (
            shouldAutoReconnectRewindSocket({
              closeCode: event.code,
              isSessionComplete: isSessionCompleteRef.current,
              reconnectAttempts: reconnectAttemptsRef.current,
              shouldReconnect: shouldReconnectRef.current,
            })
          ) {
            reconnectAttemptsRef.current += 1
            setStatusText('Reconnecting')
            const delay = 500 * 2 ** (reconnectAttemptsRef.current - 1)
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null
              void startSessionRef.current?.()
            }, delay)
            return
          }

          shouldReconnectRef.current = false
          setStatusText('Disconnected')
          if (!disconnectNoticeShownRef.current) {
            toast.error('Rewind disconnected. Tap to reconnect and continue.')
          }
        }
      }
    } catch (error) {
      isConnectingRef.current = false
      if (
        isAxiosError<{ msg?: string }>(error) &&
        error.response?.status === 409
      ) {
        setStatusText('Not scheduled now')
        void routineQuery.refetch()
        return
      }
      setStatusText('Failed')
    }
  }, [
    cleanupAudioPipeline,
    clearPlayback,
    connectMicrophone,
    persona,
    playNextAudioChunk,
    queryClient,
    navigate,
    openRoutineSettings,
    routineQuery,
    toast,
  ])

  useEffect(() => {
    startSessionRef.current = startSession
  }, [startSession])

  const conversationSummary = useMemo(() => {
    if (isConversationPaused) return 'Conversation paused'
    if (statusText === 'Speaking')
      return `${persona?.name ?? 'Rewind'} is talking`
    if (statusText === 'Listening') return 'Listening'
    if (statusText === 'Connecting') return 'Connecting...'
    if (statusText === 'Reconnecting') return 'Reconnecting...'
    if (statusText === 'Connected') return 'Connected'
    if (statusText === 'Disconnected') return 'Ended'
    if (statusText === 'Error') return 'Interrupted'
    return statusText
  }, [isConversationPaused, persona?.name, statusText])

  const previousSessionPreview = useMemo(() => {
    return previousSession?.summary ?? null
  }, [previousSession])

  const currentSessionPreview = conversationStateNote

  const openRewindInsights = useCallback(() => {
    navigate({
      to: '/app/rewind-history',
    })
  }, [navigate])

  const routineStatus = useMemo(() => {
    const formatOccurrenceTime = (value: string | null): string => {
      if (!value) return ''
      return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(value))
    }

    if (!routineQuery.data?.routine) {
      return 'Set your Rewind routine'
    }
    if (routineQuery.data.currentSession) {
      return `Open until ${formatOccurrenceTime(
        routineQuery.data.currentSession.windowEndsAt,
      )}`
    }
    if (routineQuery.data.latestSession?.status === 'COMPLETED') {
      return 'Your latest Rewind is complete'
    }
    if (routineQuery.data.latestSession?.status === 'MISSED') {
      return 'Your last Rewind window closed'
    }
    if (routineQuery.data.nextSession) {
      return `Next Rewind ${formatOccurrenceTime(
        routineQuery.data.nextSession.scheduledFor,
      )}`
    }
    return 'Your next Rewind is being scheduled'
  }, [routineQuery.data])

  const hasAvailableOccurrence = Boolean(routineQuery.data?.currentSession)

  const hasActiveSession =
    liveSessionRef.current?.readyState === WebSocket.OPEN ||
    isConnectingRef.current

  if (isAuthLoading) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <View className="flex-1 items-center justify-center px-mg">
            <Mirage size="96" speed="4.2" color="#ffffff" />
            <Text className="mt-4 muted font-bbh text-sm">
              Loading your Rewind...
            </Text>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (!isAuthenticated || !user) {
    return <></>
  }

  if (resolvedPersonaUserId !== user.id) {
    return (
      <View className="flex-1 bg-cardd">
        <NoiseComponent>
          <View className="flex-1 items-center justify-center px-mg">
            <Mirage size="96" speed="4.2" color="#ffffff" />
            <Text className="mt-4 muted font-bbh text-sm">
              Loading your Rewind partner...
            </Text>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  if (!persona) {
    return (
      <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
        <NoiseComponent>
          <View className="flex-1">
            <TabHeader title="Rewind" />
            <View className="flex-1 px-mg pb-xl">
              <View className="mt-lg mb-xl items-center">
                <Text className="muted  mt-2 font-bbh text-base text-white text-center">
                  Pick a custom-tuned persona to start your live rewind
                  conversations.
                </Text>
              </View>

              <View className="mt-mg gap-5">
                <PersonaArtwork
                  persona={previewPersona}
                  onChoose={() => {
                    void selectPersona(previewPersona.id)
                  }}
                  disabled={persistPersonaMutation.isPending}
                />

                <View className="grid grid-cols-4 gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
                  {REWIND_PERSONAS.map((p) => (
                    <PersonaThumbnail
                      key={p.id}
                      persona={p}
                      selected={previewPersonaId === p.id}
                      onSelect={setPreviewPersonaId}
                      disabled={persistPersonaMutation.isPending}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </NoiseComponent>
      </View>
    )
  }

  const opaqueColor = adjustColor(personaTheme?.darkColor || '', {
    alpha: -0.6,
  })

  return (
    <View
      className="flex-1 bg-cardd overflow-hidden"
      style={
        {
          ...(personaTheme
            ? {
                '--theme': personaTheme.color,
                '--theme-opaque': opaqueColor,
                background: `radial-gradient(circle at top, ${opaqueColor} 0%, rgba(10,10,12,0.96) 45%, rgba(6,6,8,1) 100%)`,
              }
            : undefined),
        } as CSSProperties
      }
    >
      <NoiseComponent>
        <TabHeader
          title=""
          children={
            <View className="flex-row items-center gap-2">
              {hasActiveSession ? (
                <Pressable
                  onPress={togglePauseConversation}
                  disabled={isFinishingSession}
                  accessibilityLabel={
                    isConversationPaused
                      ? 'Resume Rewind conversation'
                      : 'Pause Rewind conversation'
                  }
                  className={cn(
                    'w-11 h-11 rounded-full items-center justify-center',
                    isConversationPaused ? 'bg-white' : 'bg-cardx',
                  )}
                >
                  {isConversationPaused ? (
                    <RiPlayLine size={18} className="text-cardd" />
                  ) : (
                    <RiPauseLine size={18} className="text-white/90" />
                  )}
                </Pressable>
              ) : (
                <>
                  <Pressable
                    onPress={openRewindInsights}
                    accessibilityLabel="Open Rewind insights"
                    className="w-11 h-11 rounded-full items-center justify-center bg-cardx"
                  >
                    <RiHistoryLine size={18} className="text-white/90" />
                  </Pressable>
                  <Pressable
                    onPress={clearPersona}
                    disabled={persistPersonaMutation.isPending}
                    accessibilityLabel="Change Rewind partner"
                    className="py-3 pl-4 pr-3 !bg-[var(--theme)] gap-1 rounded-3xl items-center justify-center "
                  >
                    <Text className="text-white font-bold text-sm">
                      {persona.name}
                    </Text>
                    <RiRefreshLine
                      size={18}
                      className={cn(
                        persistPersonaMutation.isPending
                          ? 'text-white/50'
                          : 'text-white/80',
                      )}
                    />
                  </Pressable>
                </>
              )}
            </View>
          }
        />

        <View className="flex-1 min-h-0 h-full px-mg pb-xl">
          <View className="items-center h-full pt-6">
            <View className="px-3 py-2 rounded-full">
              <Text className="muted font-bbh text-xs uppercase tracking-[0.28em]">
                {isSessionRestored ? 'Restored Session' : ''}
              </Text>
            </View>
            <View className="items-center justify-center ">
              <Text className="mt-2 text-white font-display text-xl font-extrabold">
                <View className="flex-row items-center">
                  <Text className=" text-accent-400">@</Text>
                  {user?.username}
                  <UserCheckmark />
                </View>
              </Text>

              <Text className="mt-0 text-white font-display text-xl font-extrabold">
                <Text className="text-card-lighter-3">you're Rewinding W/</Text>{' '}
                <Text className="">
                  <Text className="text-[var(--theme)]">@</Text>
                  {persona.name}
                </Text>
              </Text>
            </View>

            <View className="mt-4 flex-row gap-2 flex-wrap justify-center">
              <View className="px-3 py-2 rounded-xl bg-card-light/30">
                <Text className="text-white/80 px-2 font-bold font-bbh text-xs">
                  {rewindSessionDateKey
                    ? `Rewind ${rewindSessionDateKey.slice(5)}`
                    : routineStatus}{' '}
                  <View className="flex flex-row justify-center mt-1">
                    <Text
                      className={cn(
                        ['connected', 'listening'].includes(
                          conversationSummary.toLowerCase(),
                        )
                          ? 'bg-success-green text-cardd p-0.5 rounded-full px-2'
                          : ['ended'].includes(
                                conversationSummary.toLowerCase(),
                              )
                            ? 'bg-red-500 text-white p-0.5 rounded-full px-2'
                            : 'bg-yellow-400 text-cardd p-0.5 rounded-full px-2',
                        ' whitespace-nowrap  !text-center',
                      )}
                    >
                      {conversationSummary}
                    </Text>
                  </View>
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => {
                void startSession()
              }}
              accessibilityLabel={
                hasActiveSession
                  ? isConversationPaused
                    ? 'Resume your Rewind'
                    : 'Rewind is active'
                  : 'Start your Rewind'
              }
              accessibilityRole="button"
              className={cn(
                isConversationPaused && 'saturate-0 opacity-50',
                'relative bg-[var(--theme-opaque)] aspect-square flex items-center justify-center rounded-full mt-16',
              )}
            >
              <motion.div
                initial={{ scale: 0.94 }}
                animate={{ scale: isConversationPaused ? 0.98 : 1.04 }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatType: 'mirror',
                }}
                className="flex items-center justify-center relative"
              >
                <View className="items-center scale-[2.2] justify-center">
                  <Mirage
                    size="130"
                    speed={isConversationPaused ? '10' : '4.2'}
                    color={personaTheme?.color}
                  />
                </View>
              </motion.div>
              {!hasActiveSession || isConversationPaused ? (
                <View className="pointer-events-none absolute inset-0 items-center justify-center">
                  <View className="h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                    <RiPlayLine size={30} className="ml-1 text-cardd" />
                  </View>
                </View>
              ) : null}
            </Pressable>

            {!hasActiveSession ? (
              <Pressable className="flex mt-5 flex-row items-center gap-3">
                <Text className="text-white font-bold">
                  {statusText === 'Failed' || statusText === 'Disconnected'
                    ? 'Reconnect and continue'
                    : statusText === 'Paused'
                      ? 'Resume your Rewind'
                      : !routineQuery.data?.routine
                        ? 'Set your routine to begin'
                        : !hasAvailableOccurrence
                          ? routineStatus
                          : 'Ready? tap to begin'}
                </Text>
              </Pressable>
            ) : null}

            {currentSessionPreview && hasActiveSession && (
              <View className="mt-5 max-w-[78%] items-center gap-1 text-center">
                {conversationStage ? (
                  <Text className="text-card-lighter-3/60 font-bbh text-[10px] font-bold uppercase tracking-[0.16em]">
                    {REWIND_CONVERSATION_STAGE_LABELS[conversationStage]}
                  </Text>
                ) : null}
                <Text className="muted mx-auto text-sm font-bold leading-5">
                  {currentSessionPreview}
                </Text>
              </View>
            )}

            <View className="mt-auto mb-mg w-full max-w-[340px] gap-3">
              {hasActiveSession ? (
                <Pressable
                  onPress={finishSession}
                  disabled={isFinishingSession}
                  className="min-h-12 w-full flex-row items-center justify-center gap-2 rounded-full bg-white px-4"
                >
                  <RiStopCircleLine size={19} className="text-cardd" />
                  <Text className="font-display font-bold text-cardd">
                    {isFinishingSession && finalizationStage
                      ? REWIND_FINALIZATION_LABELS[finalizationStage]
                      : 'Conclude'}
                  </Text>
                </Pressable>
              ) : null}

              {!hasActiveSession ? (
                <Pressable
                  onPress={openRoutineSettings}
                  className="w-full flex-row items-center justify-between rounded-lg bg-cardx px-4 py-3 text-left"
                >
                  <View className="min-w-0 flex-1 gap-1">
                    <Text className="muted font-bbh text-[10px] uppercase tracking-[0.18em]">
                      Rewind routine
                    </Text>
                    <Text className="muted font-bbh text-xs line-clamp-2">
                      {routineStatus}
                    </Text>
                  </View>
                  <RiSettings3Line
                    size={18}
                    className="ml-3 shrink-0 text-white/60"
                  />
                </Pressable>
              ) : null}

              <Pressable
                onPress={openRewindInsights}
                className="w-full flex-row items-center justify-between rounded-lg bg-cardx px-4 py-3 text-left"
              >
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="muted font-bbh text-[10px] uppercase tracking-[0.18em]">
                    {'Rewind insights'}
                  </Text>
                  <Text className="muted font-bbh text-xs line-clamp-2">
                    {previousSessionPreview ||
                      'See the patterns your reflections are beginning to show'}
                  </Text>
                </View>
                <RiHistoryLine
                  size={18}
                  className="ml-3 shrink-0 text-white/60"
                />
              </Pressable>
            </View>
          </View>
        </View>
      </NoiseComponent>
      <BottomNotch />
    </View>
  )
}
