import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import type { FormEvent, ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useRecordGoalProgress } from '@/hooks/use-goals.hook'
import { useTaskSheetFocus } from '@/hooks/use-task-sheet-focus.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { Attachment, Goal } from '@/shared/api/goal.api'
import { createTaskDraft } from '@/shared/goal/task-draft'
import { AttachmentPicker } from './attachment-picker.component'

export function createTaskProgressDraft() {
  return createTaskDraft<{
    amount: string
    notes: string
    attachments: Attachment[]
    pending: boolean
    uploading: boolean
    error: string | null
  }>({
    amount: '',
    notes: '',
    attachments: [],
    pending: false,
    uploading: false,
    error: null,
  })
}
export type TaskProgressDraft = ReturnType<typeof createTaskProgressDraft>

export function TaskProgressSheet({
  goal,
  draft,
  returnFocus,
  onSaved,
}: {
  goal: Goal
  draft?: TaskProgressDraft
  returnFocus?: HTMLElement | null
  onSaved?: (goal: Goal) => void
}): ReactElement {
  const [local] = useState(createTaskProgressDraft)
  const store = draft ?? local
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const record = useRecordGoalProgress()
  const sheet = useBottomSheetController()
  const content = useRef<HTMLDivElement>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useTaskSheetFocus(content, sheet.dismiss, returnFocus)
  const quantity = goal.target.type === 'QUANTITY'
  const valid =
    !quantity ||
    (Number.isFinite(Number(state.amount)) && Number(state.amount) > 0)
  const editable =
    goal.status === 'ACTIVE' && goal.isDue && Boolean(goal.nextOccurrence)
  async function save(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (
      !valid ||
      !editable ||
      !goal.nextOccurrence ||
      store.getSnapshot().pending ||
      state.uploading
    )
      return
    store.update({ pending: true, error: null })
    try {
      const response = await record.mutateAsync({
        goalId: goal.id,
        occurrenceId: goal.nextOccurrence.id,
        amount: quantity ? Number(state.amount) : undefined,
        notes: state.notes.trim() || undefined,
        attachments: state.attachments,
      })
      store.update({ amount: '', notes: '', attachments: [] })
      if (mounted.current) {
        sheet.dismiss()
        onSaved?.(response.data)
      }
    } catch (error: unknown) {
      store.update({
        error:
          error instanceof Error
            ? error.message
            : 'Could not save your progress. Try again.',
      })
    } finally {
      store.update({ pending: false })
    }
  }
  return (
    <div ref={content} className="space-y-4 pt-3">
      <p className="break-words text-sm text-card-lighter-3">{goal.title}</p>
      {!editable ? (
        <p role="status" className="text-sm text-card-lighter-3">
          This task isn’t accepting progress right now.
        </p>
      ) : null}
      <form onSubmit={(event) => void save(event)} className="space-y-4">
        {quantity ? (
          <label className="block space-y-2 text-sm font-semibold">
            Amount{' '}
            {goal.target.type === 'QUANTITY' && goal.target.unit
              ? `(${goal.target.unit})`
              : ''}
            <input
              autoFocus
              aria-label="Progress amount"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="any"
              required
              disabled={state.pending || !editable}
              value={state.amount}
              onChange={(event) =>
                store.update({ amount: event.target.value, error: null })
              }
              className="min-h-12 w-full rounded-xl bg-card-light px-3 text-base text-white outline-none"
            />
          </label>
        ) : null}
        <label className="block space-y-2 text-sm font-semibold">
          Note{' '}
          <span className="font-normal text-card-lighter-3">(optional)</span>
          <textarea
            aria-label="Progress note"
            placeholder="How did it go?"
            maxLength={2000}
            rows={3}
            disabled={state.pending || !editable}
            value={state.notes}
            onChange={(event) =>
              store.update({ notes: event.target.value, error: null })
            }
            className="w-full resize-none rounded-xl bg-card-light p-3 text-base text-white outline-none placeholder:text-card-lighter-3"
          />
        </label>
        <fieldset disabled={state.pending || state.uploading || !editable}>
          <legend className="mb-2 text-sm font-semibold">
            Attachments{' '}
            <span className="font-normal text-card-lighter-3">(optional)</span>
          </legend>
          <AttachmentPicker
            attachments={state.attachments}
            onAttachmentsChange={(attachments) => store.update({ attachments })}
            onUploadingChange={(uploading) => store.update({ uploading })}
            maxAttachments={5}
          />
        </fieldset>
        {state.error ? (
          <p role="alert" className="text-sm text-danger-400">
            {state.error}
          </p>
        ) : null}
        <Pressable
          type="submit"
          accessibilityLabel="Save progress"
          disabled={!valid || !editable || state.pending || state.uploading}
          className="min-h-12 w-full items-center justify-center rounded-full bg-white px-5 text-sm font-bold text-black active:scale-[0.98] motion-reduce:transform-none"
        >
          {state.pending ? 'Saving…' : 'Save progress'}
        </Pressable>
      </form>
    </div>
  )
}
