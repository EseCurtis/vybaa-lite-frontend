import { RiFileMusicLine, RiMicLine, RiStopFill } from '@remixicon/react'
import { useEffect, useId, useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useAudioTranscription } from '@/hooks/use-audio-transcription.hook'
import { AUDIO_ACCEPT, appendTranscript } from '@/shared/audio/transcription'

interface AudioTranscriptionProps {
  value: string
  onChange: (value: string) => void
  maxLength: number
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

function statusText(phase: string, elapsed: number, added: boolean): string {
  if (phase === 'recording')
    return `Recording ${Math.floor(elapsed / 60_000)}:${String(Math.floor(elapsed / 1000) % 60).padStart(2, '0')} · 5 minute limit`
  if (phase === 'starting') return 'Opening microphone…'
  if (phase === 'stopping') return 'Preparing recording…'
  if (phase === 'transcribing') return 'Transcribing your recording…'
  if (added) return 'Transcript added. Review the text before saving.'
  return 'Record or import audio, then review the transcript. Up to 12 MB.'
}

export function AudioTranscription({
  value,
  onChange,
  maxLength,
  disabled = false,
  onBusyChange,
}: AudioTranscriptionProps): ReactElement {
  const audio = useAudioTranscription()
  const fileInput = useRef<HTMLInputElement>(null)
  const recordButton = useRef<HTMLButtonElement>(null)
  const [added, setAdded] = useState(false)
  const id = useId()
  const busyCallback = useRef(onBusyChange)
  busyCallback.current = onBusyChange
  useEffect(() => {
    busyCallback.current?.(audio.busy)
  }, [audio.busy])
  useEffect(() => () => busyCallback.current?.(false), [])
  const merged = appendTranscript(value, audio.text)
  const overLimit = merged.length > maxLength
  const buttonClass =
    'min-h-11 items-center justify-center gap-2 rounded-full bg-card-light px-4 text-sm font-semibold text-white active:scale-95 motion-reduce:transform-none'
  function insert(): void {
    if (disabled || audio.busy || !audio.text.trim() || overLimit) return
    onChange(merged)
    audio.cancel()
    setAdded(true)
    recordButton.current?.focus()
  }
  return (
    <section aria-label="Audio transcription" className="space-y-3 font-bbh">
      <div className="flex flex-wrap items-center gap-2">
        <Pressable
          type="button"
          ref={recordButton}
          accessibilityLabel={
            audio.phase === 'recording' ? 'Stop and transcribe' : 'Record audio'
          }
          disabled={
            disabled ||
            (audio.busy && audio.phase !== 'recording') ||
            Boolean(audio.source)
          }
          className={buttonClass}
          onPress={() => {
            setAdded(false)
            void (audio.phase === 'recording' ? audio.stop() : audio.start())
          }}
        >
          {audio.phase === 'recording' ? (
            <RiStopFill size={18} aria-hidden="true" />
          ) : (
            <RiMicLine size={18} aria-hidden="true" />
          )}
          {audio.phase === 'recording' ? 'Stop & transcribe' : 'Record'}
        </Pressable>
        <Pressable
          type="button"
          accessibilityLabel="Import audio recording"
          disabled={disabled || audio.busy || Boolean(audio.source)}
          className={buttonClass}
          onPress={() => fileInput.current?.click()}
        >
          <RiFileMusicLine size={18} aria-hidden="true" /> Import audio
        </Pressable>
        <input
          ref={fileInput}
          type="file"
          accept={AUDIO_ACCEPT}
          aria-label="Choose audio recording"
          className="sr-only"
          tabIndex={-1}
          disabled={disabled || audio.busy}
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) {
              setAdded(false)
              void audio.importFile(file)
            }
          }}
        />
        {audio.busy || audio.source ? (
          <Pressable
            type="button"
            accessibilityLabel="Discard recording"
            className="min-h-11 items-center px-3 text-sm text-card-lighter-3"
            onPress={audio.cancel}
          >
            Discard
          </Pressable>
        ) : null}
      </div>
      <p role="status" className="text-xs leading-relaxed text-card-lighter-3">
        {statusText(audio.phase, audio.elapsed, added)}
      </p>
      {audio.preview ? (
        <audio
          src={audio.preview}
          controls
          preload="metadata"
          aria-label="Recording preview"
          className="w-full [color-scheme:dark]"
        />
      ) : null}
      {audio.error ? (
        <div role="alert" className="space-y-2">
          <p className="text-sm text-danger-400">{audio.error}</p>
          {audio.source ? (
            <Pressable
              type="button"
              disabled={disabled || audio.busy}
              className={buttonClass}
              onPress={() => void audio.retry()}
            >
              Retry transcription
            </Pressable>
          ) : null}
        </div>
      ) : null}
      {audio.ready ? (
        <div className="space-y-2 rounded-2xl bg-card-light-50 p-3">
          <label htmlFor={id} className="text-sm font-semibold text-white">
            Review transcript
          </label>
          <textarea
            id={id}
            value={audio.text}
            disabled={disabled || audio.busy}
            onChange={(event) => audio.setText(event.target.value)}
            className="min-h-28 w-full resize-y bg-card-light-50 py-2 text-base text-white outline-none"
          />
          {overLimit ? (
            <p role="alert" className="text-sm text-warning-400">
              Shorten the transcript by {merged.length - maxLength} characters
              to fit. Your existing text is unchanged.
            </p>
          ) : null}
          <Pressable
            type="button"
            disabled={disabled || audio.busy || !audio.text.trim() || overLimit}
            className="min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black"
            onPress={insert}
          >
            Add to text
          </Pressable>
        </div>
      ) : null}
      <p className="text-xs text-card-lighter-3">
        Audio is sent to ElevenLabs for transcription. Vybaa saves only the text
        you choose to save.
      </p>
    </section>
  )
}
