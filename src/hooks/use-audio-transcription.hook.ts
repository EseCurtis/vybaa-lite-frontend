import { useEffect, useRef, useState } from 'react'

import { transcriptionAPI } from '@/shared/api/transcription.api'
import { VoiceRecordingSession } from '@/shared/audio/recording-session'
import {
  audioFile,
  recordedAudio,
  RECORDING_MAX_MS,
} from '@/shared/audio/transcription'
import { createUUID } from '@/shared/utils/uuid.util'

type Phase = 'idle' | 'recording' | 'starting' | 'stopping' | 'transcribing'
interface SourceAudio {
  audio: Blob
  requestId: string
}

export function useAudioTranscription() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [source, setSource] = useState<SourceAudio | null>(null)
  const [preview, setPreview] = useState<string | undefined>()
  const [text, setText] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const mounted = useRef(false)
  const generation = useRef(0)
  const lock = useRef(false)
  const recorder = useRef<VoiceRecordingSession | null>(null)
  const request = useRef<AbortController | null>(null)

  function report(failure: unknown): void {
    if (mounted.current)
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not process this recording.',
      )
  }

  function cancel(): void {
    const version = ++generation.current
    request.current?.abort()
    request.current = null
    const session = recorder.current
    recorder.current = null
    lock.current = Boolean(session)
    if (session) {
      void session
        .stop()
        .catch((failure: unknown) => {
          if (version === generation.current) report(failure)
        })
        .finally(() => {
          if (version === generation.current) {
            lock.current = false
            if (mounted.current) setPhase('idle')
          }
        })
    }
    if (mounted.current) {
      setPhase(session ? 'stopping' : 'idle')
      setSource(null)
      setText('')
      setReady(false)
      setError(null)
      setElapsed(0)
    }
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      cancel()
    }
  }, [])

  useEffect(() => {
    if (!source) {
      setPreview(undefined)
      return
    }
    const url = URL.createObjectURL(source.audio)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [source])

  async function transcribe(
    input: SourceAudio,
    version: number,
  ): Promise<void> {
    const controller = new AbortController()
    request.current = controller
    setPhase('transcribing')
    setError(null)
    try {
      const result = await transcriptionAPI.create(
        input.audio,
        input.requestId,
        controller.signal,
      )
      if (mounted.current && version === generation.current) {
        setText(result.text)
        setReady(true)
      }
    } catch (failure: unknown) {
      if (!controller.signal.aborted && version === generation.current)
        report(failure)
    } finally {
      if (version === generation.current) {
        lock.current = false
        request.current = null
        if (mounted.current) setPhase('idle')
      }
    }
  }

  async function start(): Promise<void> {
    if (lock.current || source || recorder.current) return
    lock.current = true
    const version = ++generation.current
    const session = new VoiceRecordingSession()
    recorder.current = session
    setError(null)
    setPhase('starting')
    try {
      await session.start()
      if (!mounted.current || version !== generation.current) return
      setElapsed(0)
      setPhase('recording')
    } catch (failure: unknown) {
      if (version === generation.current) {
        recorder.current = null
        report(failure)
        if (mounted.current) setPhase('idle')
      }
    } finally {
      if (version === generation.current) lock.current = false
    }
  }

  async function stop(): Promise<void> {
    const session = recorder.current
    if (lock.current || !session) return
    lock.current = true
    const version = generation.current
    setPhase('stopping')
    try {
      const result = await session.stop()
      if (!mounted.current || version !== generation.current) return
      recorder.current = null
      const next = { audio: recordedAudio(result), requestId: createUUID() }
      setSource(next)
      await transcribe(next, version)
    } catch (failure: unknown) {
      if (version === generation.current) {
        recorder.current = null
        lock.current = false
        report(failure)
        if (mounted.current) setPhase('idle')
      }
    }
  }

  const latestStop = useRef(stop)
  latestStop.current = stop
  useEffect(() => {
    if (phase !== 'recording') return
    const started = Date.now()
    const timer = setInterval(() => setElapsed(Date.now() - started), 1000)
    const maximum = setTimeout(
      () => void latestStop.current(),
      RECORDING_MAX_MS,
    )
    return () => {
      clearInterval(timer)
      clearTimeout(maximum)
    }
  }, [phase])

  async function importFile(file: File): Promise<void> {
    if (lock.current || recorder.current) return
    try {
      const audio = audioFile(file)
      lock.current = true
      const version = ++generation.current
      const next = { audio, requestId: createUUID() }
      setSource(next)
      setText('')
      setReady(false)
      await transcribe(next, version)
    } catch (failure: unknown) {
      lock.current = false
      report(failure)
    }
  }

  async function retry(): Promise<void> {
    if (!source || lock.current) return
    lock.current = true
    await transcribe(source, generation.current)
  }

  return {
    phase,
    busy: phase !== 'idle',
    source,
    preview,
    text,
    ready,
    setText,
    error,
    elapsed,
    start,
    stop,
    cancel,
    importFile,
    retry,
  }
}
