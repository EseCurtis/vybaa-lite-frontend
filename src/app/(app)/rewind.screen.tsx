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
import {
  REWIND_PERSONAS,
  type RewindPersona,
  type RewindPersonaId,
  getRewindPersona,
} from '@/shared/rewind/rewind-personas'
import {
  applyAdaptiveGain,
  floatTo16BitPcmBase64,
} from '@/shared/rewind/audio-processing'
import { getEmojiIcon } from '@/shared/utils/emoji-icons.util'
import { adjustColor, cn, seededColor } from '@/shared/utils/helpers.util'
import { Icon } from '@iconify/react'
import {
  RiAddLine,
  RiPauseLine,
  RiPlayLine,
  RiRefreshLine,
} from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Mirage } from 'ldrs/react'
import 'ldrs/react/Mirage.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  | { type: 'turn_complete' }
  | { type: 'interrupted' }
  | { type: 'session_ended' }
  | { type: 'open_history' }
  | { type: 'error'; message: string }
  | { type: 'debug'; content: unknown }

type RewindSessionSnapshot = {
  sessionId: string
  sessionDateKey: string
  completed: boolean
  summary: string | null
  updatedAt: number
}

type RewindTimelineMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
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

function createConnectionId() {
  return `rewind_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createTimelineMessage(
  role: RewindTimelineMessage['role'],
  content: string,
): RewindTimelineMessage {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  }
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
}) {
  const $color = seededColor(persona.id)
  const color = adjustColor($color, { lightness: -10, saturation: -20 })
  const darkColor = adjustColor(color, { lightness: -30, saturation: -20 })

  return (
    <Pressable
      style={{
        //@ts-ignore
        '--tw-themecolor': color,
        '--tw-themecolor-dark': darkColor,
      }}
      disabled={disabled}
      onPress={() => onSelect(persona.id)}
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

export default function RewindScreen() {
  const { user, refreshSession } = useAuth()
  useBottomSheet()
  const toast = useToast()
  const [personaId, setPersonaId] = useState<RewindPersonaId | null>(null)
  const [statusText, setStatusText] = useState('Idle')
  const [isConversationPaused, setIsConversationPaused] = useState(false)
  const [rewindSessionDateKey, setRewindSessionDateKey] = useState<
    string | null
  >(null)
  const [requestedSessionId, setRequestedSessionId] = useState<string | null>(
    null,
  )
  const [isSessionRestored, setIsSessionRestored] = useState(false)
  const [timeline, setTimeline] = useState<RewindTimelineMessage[]>([])
  const [previousSession, setPreviousSession] =
    useState<RewindSessionSnapshot | null>(null)

  const liveSessionRef = useRef<WebSocket | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const inputAudioContextRef = useRef<AudioContext | null>(null)
  const processorRef = useRef<AudioNode | null>(null)
  const playbackContextRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<Array<{ data: string; mimeType: string }>>([])
  const activeAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
  const isPlayingAudioQueueRef = useRef(false)
  const nextStartTimeRef = useRef(0)
  const isConnectingRef = useRef(false)
  const isConversationPausedRef = useRef(false)
  const lastInputTranscriptRef = useRef('')
  const lastOutputTranscriptRef = useRef('')
  const navigate = useNavigate()

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
    onError: (error: any) => {
      const msg =
        error?.response?.data?.msg ||
        error?.message ||
        'Failed to save rewind persona'
      toast.error(msg)
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
    setRequestedSessionId(null)
    setTimeline([])
    setPreviousSession(null)
    setIsSessionRestored(false)
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
    liveSessionRef.current?.close()
    liveSessionRef.current = null
    cleanupAudioPipeline()
    audioQueueRef.current = []
    activeAudioSourcesRef.current.clear()
    isPlayingAudioQueueRef.current = false
    nextStartTimeRef.current = 0
    lastInputTranscriptRef.current = ''
    lastOutputTranscriptRef.current = ''
    setIsConversationPaused(false)
    setPersonaId(null)
    setRewindSessionDateKey(null)
    setRequestedSessionId(null)
    setTimeline([])
    setPreviousSession(null)
    setIsSessionRestored(false)
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
      } catch (error) {
        console.warn('[Rewind] Failed to resume playback context', error)
      }
    }
  }, [])

  const cleanupAudioPipeline = useCallback(() => {
    if (processorRef.current) {
      try {
        processorRef.current.disconnect()
      } catch {}
      processorRef.current = null
    }

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
    } catch (error) {
      console.error('[Rewind] Failed to play audio chunk', error)
      isPlayingAudioQueueRef.current = false
      if (audioQueueRef.current.length > 0) {
        void playNextAudioChunk()
      }
    }
  }, [])

  const connectMicrophone = useCallback(
    async (
      ws: WebSocket,
      connectionId: string,
      currentPersona: RewindPersona,
    ) => {
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
        const context = new AudioContextClass({ sampleRate: 16000 })
        inputAudioContextRef.current = context

        const source = context.createMediaStreamSource(stream)
        const compressor = context.createDynamicsCompressor()
        compressor.threshold.value = -30
        compressor.knee.value = 18
        compressor.ratio.value = 4
        compressor.attack.value = 0.005
        compressor.release.value = 0.2
        const sendAudio = (inputData: Float32Array): void => {
          if (isConversationPausedRef.current) return
          if (ws.readyState !== WebSocket.OPEN) return
          const data = floatTo16BitPcmBase64(applyAdaptiveGain(inputData))
          ws.send(
            JSON.stringify({
              type: 'realtime_audio',
              mimeType: 'audio/pcm;rate=16000',
              data,
            }),
          )
        }

        let processor: AudioNode
        if (context.audioWorklet) {
          const workletSource = `class RewindCaptureProcessor extends AudioWorkletProcessor {
            process(inputs) {
              const channel = inputs[0] && inputs[0][0]
              if (channel) this.port.postMessage(channel.slice())
              return true
            }
          }
          registerProcessor('rewind-capture', RewindCaptureProcessor)`
          const workletUrl = URL.createObjectURL(
            new Blob([workletSource], { type: 'text/javascript' }),
          )
          try {
            await context.audioWorklet.addModule(workletUrl)
          } finally {
            URL.revokeObjectURL(workletUrl)
          }
          const worklet = new AudioWorkletNode(context, 'rewind-capture')
          worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
            sendAudio(event.data)
          }
          processor = worklet
        } else {
          const fallbackProcessor = context.createScriptProcessor(4096, 1, 1)
          fallbackProcessor.onaudioprocess = (event) => {
            sendAudio(event.inputBuffer.getChannelData(0))
          }
          processor = fallbackProcessor
        }
        processorRef.current = processor

        source.connect(compressor)
        compressor.connect(processor)
        processor.connect(context.destination)

        console.info('[Rewind] Microphone connected', {
          connectionId,
          personaId: currentPersona.id,
        })
        if (!isConversationPausedRef.current) {
          setStatusText('Listening')
        }
      } catch (error) {
        console.error('[Rewind] Mic access failed', error)
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
      } catch (error) {
        console.warn('[Rewind] Failed to suspend playback context', error)
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
      } catch (error) {
        console.warn('[Rewind] Failed to resume playback context', error)
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

  const pushTimelineMessage = useCallback(
    (role: RewindTimelineMessage['role'], content: string) => {
      const nextContent = content.trim()
      if (!nextContent) return

      setTimeline((current) => {
        const lastMessage = current[current.length - 1]
        if (
          lastMessage &&
          lastMessage.role === role &&
          lastMessage.content === nextContent
        ) {
          return current
        }

        const nextTimeline = [
          ...current,
          createTimelineMessage(role, nextContent),
        ]
        return nextTimeline.slice(-10)
      })
    },
    [],
  )

  const upsertTimelineMessage = useCallback(
    (role: RewindTimelineMessage['role'], content: string) => {
      const nextContent = content.trim()
      if (!nextContent) return

      setTimeline((current) => {
        const lastMessage = current[current.length - 1]

        if (lastMessage?.role === role) {
          if (lastMessage.content === nextContent) {
            return current
          }

          const nextTimeline = [...current]
          nextTimeline[nextTimeline.length - 1] = {
            ...lastMessage,
            content: nextContent,
          }
          return nextTimeline
        }

        const nextTimeline = [
          ...current,
          createTimelineMessage(role, nextContent),
        ]
        return nextTimeline.slice(-10)
      })
    },
    [],
  )

  const resetRewindSession = useCallback(() => {
    liveSessionRef.current?.close()
    liveSessionRef.current = null
    cleanupAudioPipeline()
    audioQueueRef.current = []
    activeAudioSourcesRef.current.clear()
    isPlayingAudioQueueRef.current = false
    nextStartTimeRef.current = 0
    lastInputTranscriptRef.current = ''
    lastOutputTranscriptRef.current = ''
    setIsConversationPaused(false)
    setRewindSessionDateKey(null)
    setRequestedSessionId(createConnectionId())
    setTimeline([])
    setIsSessionRestored(false)
    setStatusText('Ready')
  }, [cleanupAudioPipeline])

  useEffect(() => {
    if (!persona) {
      liveSessionRef.current?.close()
      liveSessionRef.current = null
      cleanupAudioPipeline()
      audioQueueRef.current = []
      activeAudioSourcesRef.current.clear()
      isPlayingAudioQueueRef.current = false
      nextStartTimeRef.current = 0
      lastInputTranscriptRef.current = ''
      lastOutputTranscriptRef.current = ''
      setIsConversationPaused(false)
      setStatusText('Idle')
      return
    }

    return () => {
      console.info('[Rewind] Cleaning up live session', {
        personaId: persona.id,
      })
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
    const connectionId = createConnectionId()

    try {
      setIsConversationPaused(false)
      setStatusText('Connecting')

      const liveToken = await rewindAPI.createLiveToken(
        persona.id,
        requestedSessionId,
      )
      const apiUrl = ENV.API_BASE_URL.replace(/\/+$/, '')
      const wsUrl = `${apiUrl.replace(/^http/, 'ws')}${liveToken.data.wsUrl}`
      setRewindSessionDateKey(liveToken.data.sessionDateKey ?? null)

      console.info('[Rewind] Opening live websocket', {
        connectionId,
        personaId: persona.id,
        sessionId: liveToken.data.sessionId,
        wsUrl,
      })

      const ws = new WebSocket(wsUrl)
      liveSessionRef.current = ws

      ws.onopen = async () => {
        console.info('[Rewind] WebSocket opened', {
          connectionId,
          personaId: persona.id,
        })
        isConnectingRef.current = false
        setStatusText('Connected')
        await connectMicrophone(ws, connectionId, persona)
      }

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as RewindSocketMessage

          if (payload.type === 'ready') {
            setRewindSessionDateKey(payload.sessionDateKey ?? null)
            setIsSessionRestored(Boolean(payload.restored))
            setPreviousSession(payload.previousSession ?? null)
            pushTimelineMessage(
              'system',
              payload.restored
                ? `Restored your last ${persona.name} rewind session.`
                : `Connected to ${persona.name}. Start talking when you’re ready.`,
            )
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
            if (payload.content !== lastInputTranscriptRef.current) {
              lastInputTranscriptRef.current = payload.content
              pushTimelineMessage('user', payload.content)
            }
            setStatusText('Listening')
            return
          }

          if (payload.type === 'output_transcription') {
            if (isConversationPausedRef.current) return
            if (payload.content !== lastOutputTranscriptRef.current) {
              lastOutputTranscriptRef.current = payload.content
              upsertTimelineMessage('assistant', payload.content)
            }
            setStatusText('Speaking')
            return
          }

          if (payload.type === 'turn_complete') {
            lastInputTranscriptRef.current = ''
            lastOutputTranscriptRef.current = ''
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
            toast.success('Session completed!')
            navigate({ to: '/app/rewind-history' })
            return
          }

          if (payload.type === 'open_history') {
            navigate({ to: '/app/rewind-history' })
            return
          }

          if (payload.type === 'error') {
            console.error('[Rewind] Server error', payload.message)
            setStatusText('Error')
          }
        } catch (error) {
          console.error('[Rewind] Failed to parse websocket message', {
            connectionId,
            personaId: persona.id,
            error,
            raw: event.data,
          })
        }
      }

      ws.onerror = (event) => {
        console.error('[Rewind] WebSocket error', {
          connectionId,
          personaId: persona.id,
          event,
        })
        isConnectingRef.current = false
        setStatusText('Error')
      }

      ws.onclose = (event) => {
        console.info('[Rewind] WebSocket closed', {
          connectionId,
          personaId: persona.id,
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        })

        isConnectingRef.current = false
        cleanupAudioPipeline()
        if (liveSessionRef.current === ws) {
          liveSessionRef.current = null
        }
        setStatusText('Disconnected')
      }
    } catch (error) {
      isConnectingRef.current = false
      console.error('[Rewind] Failed to start live session', {
        connectionId,
        personaId: persona.id,
        error,
      })
      setStatusText('Failed')
    }
  }, [
    cleanupAudioPipeline,
    connectMicrophone,
    persona,
    playNextAudioChunk,
    pushTimelineMessage,
    requestedSessionId,
    upsertTimelineMessage,
  ])

  const conversationSummary = useMemo(() => {
    if (isConversationPaused) return 'Conversation paused'
    if (statusText === 'Speaking')
      return `${persona?.name ?? 'Rewind'} is talking`
    if (statusText === 'Listening') return 'Listening'
    if (statusText === 'Connecting') return 'Connecting...'
    if (statusText === 'Connected') return 'Connected'
    if (statusText === 'Disconnected') return 'Ended'
    if (statusText === 'Error') return 'Interrupted'
    return statusText
  }, [isConversationPaused, persona?.name, statusText])

  const previousSessionPreview = useMemo(() => {
    return previousSession?.summary ?? null
  }, [previousSession])

  const currentSessionItems = useMemo(() => {
    return timeline.filter((item) => item.role !== 'system').slice(-6)
  }, [timeline])

  const currentSessionPreview = useMemo(() => {
    return currentSessionItems[currentSessionItems.length - 1]?.content ?? null
  }, [currentSessionItems])

  const openSessionHistory = useCallback(() => {
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
                <Text className="mt-2 text-white/60 font-bbh text-base text-center">
                  Pick a custom-tuned persona to start your live rewind
                  conversations.
                </Text>
                {/* {persistPersonaMutation.isPending && (
                  <Text className="mt-2 text-white/40 font-bbh text-sm text-center">
                    Saving...
                  </Text>
                )} */}
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
      style={{
        ...(personaTheme
          ? {
              '--theme': personaTheme.color,
              '--theme-opaque': opaqueColor,
              background: `radial-gradient(circle at top, ${opaqueColor} 0%, rgba(10,10,12,0.96) 45%, rgba(6,6,8,1) 100%)`,
            }
          : undefined),
      }}
    >
      <NoiseComponent>
        <TabHeader
          title=""
          children={
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={togglePauseConversation}
                disabled={!hasActiveSession}
                className={cn(
                  'w-11 h-11 rounded-full items-center justify-center',
                  !hasActiveSession && 'opacity-40',
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
              <Pressable
                onPress={resetRewindSession}
                className="w-11 h-11 rounded-full items-center justify-center bg-white/8"
              >
                <RiAddLine size={18} className="text-white/90" />
              </Pressable>
              <Pressable
                onPress={clearPersona}
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
            </View>
          }
        />

        <View className="flex-1 min-h-0 h-full px-mg pb-xl">
          <View className="items-center h-full  pt-6">
            <View className="px-3 py-2 rounded-full ">
              <Text className="text-white/65 font-bbh text-xs uppercase tracking-[0.28em]">
                {isSessionRestored ? 'Restored Session' : ''}
              </Text>
            </View>
            <Text className="mt-2 text-white font-bbh text-xl font-extrabold">
              <Text className="">
                <Text className="text-[var(--theme)]">@</Text>
                {persona.name}
              </Text>
            </Text>

            <Text className="mt-5 text-white font-bbh text-2xl font-extrabold">
              <Text className="text-card-lighter-3">Rewinding W/</Text>{' '}
              <Text className="text-accent-400">@</Text>
              <Text className="opacity-40">{user?.username}</Text>
            </Text>

            <View className="mt-4 flex-row gap-2 flex-wrap justify-center">
              <View className="px-3 py-2 rounded-full bg-white/6">
                <Text className="text-white/80 font-bold font-bbh text-xs">
                  {rewindSessionDateKey
                    ? `Daily Rewind ${rewindSessionDateKey.slice(5)}`
                    : conversationSummary.toLowerCase() == 'failed'
                      ? 'Unavailable'
                      : 'Ready'}{' '}
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

            <View
            onClick={startSession}
              className={cn(
                isConversationPaused && 'saturate-0 opacity-50',
                'bg-[var(--theme-opaque)] aspect-square flex items-center justify-center rounded-full  mt-auto',
              )}
            >
              <motion.div
                initial={{ scale: 0.94 }}
                animate={{
                  scale: isConversationPaused ? 0.98 : 1.04,
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatType: 'mirror',
                }}
                className=" flex items-center justify-center relative"
              >
                <View className="items-center scale-[2.2] justify-center">
                  <Mirage
                    size="130"
                    speed={isConversationPaused ? '10' : '4.2'}
                    color={personaTheme?.color}
                  />
                </View>
              </motion.div>
            </View>

            {hasActiveSession ? (
              ''
            ) : (
              <Pressable onPress={startSession} className="flex mt-5 flex-row items-center gap-3">
                <Text className="text-white font-bold">Ready? tap to begin</Text>

                
              </Pressable>
            )}
            <Pressable
              onPress={openSessionHistory}
              className="mt-auto relative mb-mg  flex flex-col w-full max-w-[340px] rounded-[30px]  p-3"
            >
              <View
                style={{
                  maskImage:
                    'linear-gradient(to top, transparent 70%, white 90%)',
                }}
                className="-top-[2vh] -translate-x-1/2 left-1/2 w-[100vw] aspect-[1.7/1] border absolute rounded-[300px] border-[var(--theme)]"
              ></View>

              <View className="mt-3 flex-col gap-2">
                <View className="flex-1 min-w-0 rounded-[22px] bg-card-light/[0.14] px-3 py-3">
                  <Text className="mt-1 text-white font-bold font-bbh text-xs line-clamp-2">
                    " {currentSessionPreview || 'Live session just started'}"
                  </Text>
                </View>

                <View className="flex-1 min-w-0 rounded-[22px] bg-card-light-50 px-3 py-3">
                  <Text className="text-white/45 font-bbh text-[10px] uppercase tracking-[0.18em]">
                    Last Session
                  </Text>
                  <Text className="mt-1 text-white/80 font-bbh text-xs line-clamp-2">
                    {previousSessionPreview || 'No saved rewind yet'}
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>
      </NoiseComponent>
      <BottomNotch />
    </View>
  )
}
