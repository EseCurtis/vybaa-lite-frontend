import { Icon } from '@iconify/react'
import {
  RiHistoryLine,
  RiPauseLine,
  RiPlayLine,
  RiRefreshLine,
  RiStopCircleLine,
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
import ENV from '@/env'
import { useBottomSheet } from '@/hooks/use-bottom-sheet.hook'
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
import {
  createRewindCaptureWorkletSource,
  getRewindCaptureFrameSize,
  REWIND_CAPTURE_WORKLET_NAME,
} from '@/shared/rewind/rewind-audio-worklet'
import { shouldAutoReconnectRewindSocket } from '@/shared/rewind/rewind-live-reconnect'
import {
  REWIND_PERSONAS,
  getRewindPersona,
  type RewindPersona,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'

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
  | { type: 'conversation_state'; content: string }
  | { type: 'reconnected' }
  | { type: 'reconnecting' }
  | { type: 'turn_complete' }
  | { type: 'interrupted' }
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

function PersonaCard({
  persona,
  onSelect,
  disabled,
}: {
  persona: RewindPersona
  onSelect: (id: RewindPersonaId) => void
  disabled?: boolean
}): ReactElement {
  const $color = seededColor(persona.id)
  const color = adjustColor($color, { lightness: -10, saturation: -20 })
  const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })

  return (
    <Pressable
      style={
        {
          '--tw-themecolor': color,
          '--tw-themecolor-dark': darkColor,
        } as CSSProperties
      }
      disabled={disabled}
      onPress={() => onSelect(persona.id)}
      accessibilityLabel={`Choose ${persona.name}. ${persona.perspective}`}
      className={cn(
        'w-full flex flex-col rounded-[50px] relative overflow-hidden aspect-square items-end justify-end',
        'bg-[var(--tw-themecolor)]',
      )}
    >
      <View className="w-20 rounded-full absolute scale-150 top-0 left-0 brightness-0 items-center justify-center">
        <Icon
          icon={getEmojiIcon(persona.emoji)}
          className="text-white opacity-20"
          style={{ fontSize: '94px' }}
        />
      </View>
      <Text className="mt-3 z-10 text-white text-[var(--tw-themecolor-dark)] font-extrabold text-2xl p-5">
        {persona.name}
      </Text>
    </Pressable>
  )
}

export default function RewindScreen(): ReactElement {
  const { user, refreshSession } = useAuth()
  useBottomSheet()
  const toast = useToast()
  const [personaId, setPersonaId] = useState<RewindPersonaId | null>(null)
  const [statusText, setStatusText] = useState('Idle')
  const [isConversationPaused, setIsConversationPaused] = useState(false)
  const [rewindSessionDateKey, setRewindSessionDateKey] = useState<
    string | null
  >(null)
  const [isSessionRestored, setIsSessionRestored] = useState(false)
  const [isFinishingSession, setIsFinishingSession] = useState(false)
  const [conversationStateNote, setConversationStateNote] = useState<
    string | null
  >(null)
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
  const isConnectingRef = useRef(false)
  const isConversationPausedRef = useRef(false)
  const isSessionCompleteRef = useRef(false)
  const shouldReconnectRef = useRef(false)
  const disconnectNoticeShownRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startSessionRef = useRef<(() => Promise<void>) | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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
    const backendPersona = user?.rewindPersona as RewindPersonaId | undefined
    if (!backendPersona) return
    setPersonaId(backendPersona)
  }, [user?.rewindPersona])

  useEffect(() => {
    if (!personaId) return
    setRewindSessionDateKey(null)
    setConversationStateNote(null)
    setPreviousSession(null)
    setIsSessionRestored(false)
    setIsFinishingSession(false)
    isSessionCompleteRef.current = false
    setStatusText('Ready')
  }, [personaId])

  const persona = useMemo(() => {
    if (!personaId) return null
    return getRewindPersona(personaId)
  }, [personaId])

  const personaTheme = useMemo(() => {
    if (!persona) return null
    const $color = seededColor(persona.id)
    const color = adjustColor($color, { lightness: -10, saturation: -20 })
    const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })
    return { color, darkColor }
  }, [persona])

  const selectPersona = async (nextPersona: RewindPersonaId) => {
    await primePlaybackContext()
    setPersonaId(nextPersona)
    await persistPersonaMutation.mutateAsync(nextPersona)
  }

  const clearPersona = async () => {
    shouldReconnectRef.current = false
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    liveSessionRef.current?.close()
    liveSessionRef.current = null
    cleanupAudioPipeline()
    audioQueueRef.current = []
    activeAudioSourcesRef.current.clear()
    isPlayingAudioQueueRef.current = false
    nextStartTimeRef.current = 0
    setIsConversationPaused(false)
    setPersonaId(null)
    setRewindSessionDateKey(null)
    setConversationStateNote(null)
    setPreviousSession(null)
    setIsSessionRestored(false)
    setIsFinishingSession(false)
    isSessionCompleteRef.current = false
    setStatusText('Idle')
    await persistPersonaMutation.mutateAsync(null)
  }

  const primePlaybackContext = useCallback(async () => {
    if (typeof window === 'undefined') return

    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    if (!playbackContextRef.current) {
      playbackContextRef.current = new AudioContextClass({ sampleRate: 24000 })
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

  const playNextAudioChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingAudioQueueRef.current = false
      return
    }

    isPlayingAudioQueueRef.current = true
    const chunk = audioQueueRef.current.shift()
    if (!chunk) {
      isPlayingAudioQueueRef.current = false
      return
    }

    try {
      if (!chunk.mimeType.includes('audio/pcm')) {
        isPlayingAudioQueueRef.current = false
        return
      }

      if (!playbackContextRef.current) {
        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext
        playbackContextRef.current = new AudioContextClass({
          sampleRate: 24000,
        })
      }

      const ctx = playbackContextRef.current
      if (ctx.state === 'suspended') await ctx.resume()

      const binary = atob(chunk.data)
      const bytes = new Int16Array(binary.length / 2)
      for (let i = 0; i < binary.length; i += 2) {
        bytes[i / 2] =
          (binary.charCodeAt(i) & 0xff) |
          ((binary.charCodeAt(i + 1) & 0xff) << 8)
      }

      const floatData = new Float32Array(bytes.length)
      for (let i = 0; i < bytes.length; i++) {
        floatData[i] = bytes[i] / 32768
      }

      const buffer = ctx.createBuffer(1, floatData.length, 24000)
      buffer.getChannelData(0).set(floatData)

      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      activeAudioSourcesRef.current.add(source)

      const now = ctx.currentTime
      if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now + 0.05
      }

      source.start(nextStartTimeRef.current)
      nextStartTimeRef.current += buffer.duration
      setStatusText('Speaking')

      setTimeout(
        () => {
          void playNextAudioChunk()
        },
        Math.max(0, (nextStartTimeRef.current - now - 0.1) * 1000),
      )

      source.onended = () => {
        activeAudioSourcesRef.current.delete(source)
        if (
          !isConversationPausedRef.current &&
          audioQueueRef.current.length === 0 &&
          ctx.currentTime >= nextStartTimeRef.current - 0.05
        ) {
          setStatusText('Listening')
          isPlayingAudioQueueRef.current = false
        }
      }
    } catch {
      setStatusText('Playback interrupted')
      isPlayingAudioQueueRef.current = false
      if (audioQueueRef.current.length > 0) {
        void playNextAudioChunk()
      }
    }
  }, [])

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
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        mediaStreamRef.current = stream

        const AudioContextClass =
          window.AudioContext || (window as any).webkitAudioContext
        const context = new AudioContextClass()
        inputAudioContextRef.current = context
        if (context.state === 'suspended') await context.resume()

        const source = context.createMediaStreamSource(stream)
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -34
        compressor.knee.value = 20
        compressor.ratio.value = 3
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
          compressor,
          processor,
          silentSink,
        ]

        source.connect(compressor)
        compressor.connect(processor)
        // Keep the capture graph alive without ever routing microphone audio to speakers.
        processor.connect(silentSink)
        silentSink.connect(context.destination)

        if (!isConversationPausedRef.current) {
          setStatusText('Listening')
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Microphone access denied',
        )
        setStatusText('Mic blocked')
      }
    },
    [primePlaybackContext, toast],
  )

  const pauseConversation = useCallback(async () => {
    setIsConversationPaused(true)
    if (liveSessionRef.current?.readyState === WebSocket.OPEN) {
      liveSessionRef.current.send(JSON.stringify({ type: 'audio_stream_end' }))
    }
    audioQueueRef.current = []
    isPlayingAudioQueueRef.current = false

    for (const source of activeAudioSourcesRef.current) {
      try {
        source.stop()
      } catch {}
    }
    activeAudioSourcesRef.current.clear()

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
  }, [])

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

    isConversationPausedRef.current = true
    setIsConversationPaused(true)
    setIsFinishingSession(true)
    setStatusText('Wrapping up')
    cleanupAudioPipeline()
    liveSession.send(JSON.stringify({ type: 'finish_session' }))
  }, [cleanupAudioPipeline, isFinishingSession])

  useEffect(() => {
    if (!persona) {
      liveSessionRef.current?.close()
      liveSessionRef.current = null
      cleanupAudioPipeline()
      audioQueueRef.current = []
      activeAudioSourcesRef.current.clear()
      isPlayingAudioQueueRef.current = false
      nextStartTimeRef.current = 0
      setIsConversationPaused(false)
      setIsFinishingSession(false)
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
      audioQueueRef.current = []
      activeAudioSourcesRef.current.clear()
      isPlayingAudioQueueRef.current = false
      nextStartTimeRef.current = 0
    }
  }, [cleanupAudioPipeline, persona])

  const startSession = useCallback(async () => {
    if (!persona) return
    if (isConnectingRef.current) return
    if (liveSessionRef.current?.readyState === WebSocket.OPEN) return

    isConnectingRef.current = true
    shouldReconnectRef.current = true
    disconnectNoticeShownRef.current = false
    try {
      setIsConversationPaused(false)
      setIsFinishingSession(false)
      isSessionCompleteRef.current = false
      setStatusText('Connecting')

      const liveToken = await rewindAPI.createLiveToken(persona.id)
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
            }
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
            audioQueueRef.current = []
            nextStartTimeRef.current = 0
            for (const source of activeAudioSourcesRef.current) source.stop()
            activeAudioSourcesRef.current.clear()
            isPlayingAudioQueueRef.current = false
            setStatusText('Listening')
            return
          }

          if (payload.type === 'session_ended') {
            isSessionCompleteRef.current = true
            shouldReconnectRef.current = false
            setIsFinishingSession(false)
            setStatusText('Completed')
            cleanupAudioPipeline()
            toast.success('Your Rewind summary is ready')
            liveSessionRef.current?.close(1000, 'Session completed')
            void queryClient
              .invalidateQueries({
                queryKey: rewindQueryKeys.all,
                refetchType: 'all',
              })
              .finally(() => {
                if (payload.sessionId) {
                  navigate({
                    params: { sessionId: payload.sessionId },
                    to: '/app/r/$sessionId',
                  })
                  return
                }
                navigate({ to: '/app/rewind-history' })
              })
            return
          }

          if (payload.type === 'open_history') {
            navigate({ to: '/app/rewind-history/sessions' })
            return
          }

          if (payload.type === 'error') {
            disconnectNoticeShownRef.current = true
            setStatusText('Error')
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
        cleanupAudioPipeline()
        if (liveSessionRef.current === ws) {
          liveSessionRef.current = null
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
    } catch {
      isConnectingRef.current = false
      setStatusText('Failed')
    }
  }, [
    cleanupAudioPipeline,
    connectMicrophone,
    persona,
    playNextAudioChunk,
    queryClient,
    navigate,
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

  const hasActiveSession =
    liveSessionRef.current?.readyState === WebSocket.OPEN ||
    isConnectingRef.current

  if (!persona) {
    return (
      <View className="flex-1 bg-cardd overflow-y-auto no-scrollbar">
        <NoiseComponent>
          <View className="flex-1">
            <TabHeader title="Rewind" />
            <View className="flex-1 px-mg pb-xl">
              <View className="mt-lg mb-xl items-center">
                <Text className="text-white font-bbh text-2xl font-bold text-center">
                  Choose your Rewind partner
                </Text>
                <Text className="muted mt-2 font-bbh text-base text-center">
                  Pick a custom-tuned persona to start your live rewind
                  conversations.
                </Text>
              </View>

              <View className="grid grid-cols-2 h-[calc(100%-40vh)] items-center [&>div]:shrink-0 overflow-y-auto gap-3 mt-mg">
                {REWIND_PERSONAS.map((p) => (
                  <PersonaCard
                    key={p.id}
                    persona={p}
                    onSelect={selectPersona}
                    disabled={persistPersonaMutation.isPending}
                  />
                ))}
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
                    isConversationPaused
                      ? 'bg-white'
                      : 'bg-white/8 backdrop-blur-md',
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
                    className="w-11 h-11 rounded-full items-center justify-center bg-white/8"
                  >
                    <RiHistoryLine size={18} className="text-white/90" />
                  </Pressable>
                  <Pressable
                    onPress={clearPersona}
                    disabled={persistPersonaMutation.isPending}
                    accessibilityLabel="Change Rewind partner"
                    className="w-11 h-11 rounded-full items-center justify-center bg-white/8"
                  >
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
              <Text className="mt-2 text-white font-bbh text-xl font-extrabold">
                <Text className="text-[var(--theme)]">@</Text>
                {persona.name}
              </Text>

              <Text className="mt-3 text-white font-bbh text-2xl font-extrabold">
                <Text className="text-card-lighter-3">Rewinding W/</Text>{' '}
                <Text className="text-accent-400">@</Text>
                <Text className="">{user?.username}</Text>
              </Text>
            </View>

            <View className="mt-4 flex-row gap-2 flex-wrap justify-center">
              <View className="px-3 py-2 rounded-full bg-white/6">
                <Text className="text-white/80 font-bold font-bbh text-xs">
                  {rewindSessionDateKey
                    ? `Daily Rewind ${rewindSessionDateKey.slice(5)}`
                    : conversationSummary.toLowerCase() === 'failed'
                      ? 'Unavailable'
                      : 'Connected'}{' '}
                  -{' '}
                  <Text
                    className={cn(
                      ['connected', 'listening'].includes(
                        conversationSummary.toLowerCase(),
                      )
                        ? 'bg-success-green/70 text-white p-0.5 rounded-full px-2'
                        : ['ended'].includes(conversationSummary.toLowerCase())
                          ? 'bg-red-500/70 text-white p-0.5 rounded-full px-2'
                          : 'bg-orange-500/70 text-white p-0.5 rounded-full px-2',
                    )}
                  >
                    {conversationSummary}
                  </Text>
                </Text>
              </View>
            </View>

            <Pressable
              onPress={startSession}
              className={cn(
                isConversationPaused && 'saturate-0 opacity-50',
                'bg-[var(--theme-opaque)] aspect-square flex items-center justify-center rounded-full mt-16',
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
            </Pressable>

            {!hasActiveSession ? (
              <Pressable className="flex mt-5 flex-row items-center gap-3">
                <Text className="text-white font-bold">
                  {statusText === 'Failed' || statusText === 'Disconnected'
                    ? 'Reconnect and continue'
                    : 'Ready? tap to begin'}
                </Text>
              </Pressable>
            ) : null}

            {currentSessionPreview && hasActiveSession && (
              <View className="flex text-center mt-5 flex-row items-center gap-3 mx-auto">
                <Text className="muted text-sm max-w-[70%] mx-auto font-bold">
                  "{currentSessionPreview}"
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
                  <Text className="font-bbh font-bold text-cardd">
                    {isFinishingSession ? 'Saving summary...' : 'Conclude'}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={openRewindInsights}
                className="w-full flex-row items-center justify-between rounded-lg bg-card-light/15 px-4 py-3 text-left"
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
