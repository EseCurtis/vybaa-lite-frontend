import { useEffect, useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { AudioTranscription } from '@/components/common/audio-transcription.component'
import { Pressable } from '@/components/layout/pressables.component'
import {
  useCreateJournal,
  useJournalByDate,
  useUpdateJournal,
} from '@/hooks/use-journal.hook'
import { ApiError, getCurrentTimezone } from '@/shared/api/http'

export function JournalInsightSheet({
  onClose,
}: {
  onClose?: () => void
}): ReactElement {
  const [date] = useState(() =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: getCurrentTimezone(),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date()),
  )
  const [text, setText] = useState('')
  const [voiceBusy, setVoiceBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dirty = useRef(false)
  const saving = useRef(false)
  const query = useJournalByDate(date)
  const journal = query.data?.data.journal
  const create = useCreateJournal()
  const update = useUpdateJournal()
  const busy = create.isPending || update.isPending
  const loadFailed =
    query.isError &&
    !(query.error instanceof ApiError && query.error.status === 404)
  useEffect(() => {
    if (journal && !dirty.current) setText(journal.entry ?? '')
  }, [journal])
  function change(value: string): void {
    dirty.current = true
    setText(value)
  }
  async function save(): Promise<void> {
    if (
      !text.trim() ||
      busy ||
      voiceBusy ||
      saving.current ||
      query.isLoading ||
      loadFailed
    )
      return
    saving.current = true
    setError(null)
    try {
      if (journal)
        await update.mutateAsync({
          journalId: journal.id,
          data: { entry: text.trim() },
        })
      else await create.mutateAsync({ date, entry: text.trim() })
      onClose?.()
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save your entry. Your text is still here.',
      )
    } finally {
      saving.current = false
    }
  }
  return (
    <section className="space-y-4 font-bbh">
      <h2 className="text-xl font-semibold text-white">Daily Check In</h2>
      <p className="text-sm text-card-lighter-3">
        Write a few lines or transcribe an audio recording.
      </p>
      {loadFailed ? (
        <p role="alert" className="text-sm text-danger-400">
          Your existing entry could not load.{' '}
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="min-h-11 px-2 font-semibold"
          >
            Retry
          </button>
        </p>
      ) : null}
      <label className="block space-y-2 text-sm text-card-lighter-3">
        Your check-in
        <textarea
          value={text}
          onChange={(event) => change(event.target.value)}
          maxLength={1000}
          disabled={busy || query.isLoading || loadFailed}
          placeholder="How was your day? Any wins, challenges, or feelings to note?"
          className="min-h-32 w-full rounded-xl bg-card-light-50 p-3 text-base text-white placeholder:text-card-lighter-3 outline-none"
        />
      </label>
      <p className="text-right text-xs text-card-lighter-3">
        {text.length}/1000
      </p>
      <AudioTranscription
        value={text}
        onChange={change}
        maxLength={1000}
        disabled={busy || query.isLoading || loadFailed}
        onBusyChange={setVoiceBusy}
      />
      {error ? (
        <p role="alert" className="text-sm text-danger-400">
          {error}
        </p>
      ) : null}
      <div className="flex gap-3">
        <Pressable
          type="button"
          onPress={onClose}
          disabled={busy}
          className="min-h-11 flex-1 items-center justify-center rounded-full bg-card-light px-4 text-sm text-white"
        >
          Cancel
        </Pressable>
        <Pressable
          type="button"
          onPress={() => void save()}
          disabled={
            busy || voiceBusy || query.isLoading || loadFailed || !text.trim()
          }
          className="min-h-11 flex-1 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black"
        >
          {busy ? 'Saving…' : 'Save'}
        </Pressable>
      </div>
    </section>
  )
}
