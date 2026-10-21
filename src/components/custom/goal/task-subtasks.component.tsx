import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiPencilLine,
} from '@remixicon/react'
import type { FormEvent, ReactElement } from 'react'
import { useRef, useState, useSyncExternalStore } from 'react'

import { QueryFeedback } from '@/components/common/query-feedback.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { Pressable } from '@/components/layout/pressables.component'
import { useGoalSubtasks } from '@/hooks/use-goal-subtasks.hook'
import { useTaskSheetFocus } from '@/hooks/use-task-sheet-focus.hook'
import { useBottomSheetController } from '@/providers/bottom-sheet.provider'
import type { GoalSubtask } from '@/shared/api/goal-subtask.api'
import type { Goal } from '@/shared/api/goal.api'
import { createSubtaskDraft } from '@/shared/goal/subtask-draft'
import type { SubtaskDraftStore } from '@/shared/goal/subtask-draft'
import { createUUID } from '@/shared/utils/uuid.util'

export function TaskSubtasks({
  goal,
  draft,
  returnFocus,
}: {
  goal: Pick<Goal, 'id' | 'status' | 'archivedAt'>
  draft?: SubtaskDraftStore
  returnFocus?: HTMLElement | null
}): ReactElement {
  const content = useRef<HTMLElement>(null)
  const sheet = useBottomSheetController()
  useTaskSheetFocus(content, sheet.dismiss, returnFocus)
  const [localDraft] = useState(createSubtaskDraft)
  const store = draft ?? localDraft
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const title = state.title
  const { query, create, update } = useGoalSubtasks(goal.id)
  const [editing, setEditing] = useState<GoalSubtask | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [removed, setRemoved] = useState<GoalSubtask | null>(null)
  const items = query.data ?? []
  const completed = items.filter((item) => item.completedAt).length
  const editable = goal.status === 'ACTIVE' && !goal.archivedAt
  const busy = state.pending || create.isPending || update.isPending

  async function add(event: FormEvent): Promise<void> {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || busy || store.getSnapshot().pending || !editable) return
    const request =
      state.request?.title === trimmed
        ? state.request
        : { id: createUUID(), title: trimmed }
    store.update({ request, pending: true, error: null })
    try {
      await create.mutateAsync(request)
      store.update({ title: '', request: null })
    } catch (error: unknown) {
      store.update({
        error:
          error instanceof Error
            ? error.message
            : 'Could not save this subtask. Try again.',
      })
    } finally {
      store.update({ pending: false })
    }
  }

  return (
    <section ref={content} aria-label="Subtasks" className="space-y-3 pt-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="sr-only">Subtasks</h3>
        <span
          aria-live="polite"
          className="text-xs tabular-nums text-card-lighter-2"
        >
          {completed}/{items.length}
        </span>
      </div>
      {query.isPending ? (
        <Skeleton className="h-14 w-full" rounded="lg" />
      ) : null}
      {query.isError ? (
        <QueryFeedback
          message="Subtasks could not refresh."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
      {!items.length && !query.isPending && !query.isError ? (
        <p className="text-sm text-card-lighter-2">
          {editable ? 'Break it into smaller steps.' : 'No subtasks added.'}
        </p>
      ) : null}
      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex min-h-14 items-center gap-2 rounded-xl bg-card-light-50 pr-1"
          >
            <Pressable
              accessibilityLabel={`${item.completedAt ? 'Reopen' : 'Complete'} ${item.title}`}
              type="button"
              aria-pressed={Boolean(item.completedAt)}
              disabled={!editable || busy}
              className="size-11 shrink-0 items-center justify-center"
              onPress={() =>
                update.mutate({
                  id: item.id,
                  revision: item.revision,
                  completed: !item.completedAt,
                })
              }
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full ${item.completedAt ? 'bg-white text-black' : 'bg-card-light text-card-lighter-2'}`}
              >
                {item.completedAt ? (
                  <RiCheckLine size={17} />
                ) : (
                  <span className="size-3 rounded-full bg-card-lighter-3" />
                )}
              </span>
            </Pressable>
            {editing?.id === item.id ? (
              <form
                className="flex min-w-0 flex-1 items-center"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (editTitle.trim() && !busy)
                    update.mutate(
                      {
                        id: item.id,
                        revision: item.revision,
                        title: editTitle.trim(),
                      },
                      { onSuccess: () => setEditing(null) },
                    )
                }}
              >
                <input
                  aria-label="Subtask title"
                  autoFocus
                  maxLength={500}
                  value={editTitle}
                  className="min-h-11 min-w-0 flex-1 bg-card-light px-2 text-sm text-white outline-none"
                  onChange={(event) => setEditTitle(event.target.value)}
                />
                <Pressable
                  type="submit"
                  accessibilityLabel="Save subtask title"
                  disabled={busy || !editTitle.trim()}
                  className="size-11 items-center justify-center"
                >
                  <RiCheckLine size={19} />
                </Pressable>
                <Pressable
                  accessibilityLabel="Cancel editing subtask"
                  type="button"
                  className="size-11 items-center justify-center"
                  onPress={() => setEditing(null)}
                >
                  <RiCloseLine size={19} />
                </Pressable>
              </form>
            ) : (
              <>
                <span
                  className={`min-w-0 flex-1 break-words text-sm ${item.completedAt ? 'text-card-lighter-3 line-through' : 'text-white'}`}
                >
                  {item.title}
                </span>
                {editable ? (
                  <>
                    <Pressable
                      accessibilityLabel={`Edit ${item.title}`}
                      type="button"
                      disabled={busy}
                      className="size-11 shrink-0 items-center justify-center text-card-lighter-2"
                      onPress={() => {
                        setEditing(item)
                        setEditTitle(item.title)
                      }}
                    >
                      <RiPencilLine size={16} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel={`Remove ${item.title}`}
                      type="button"
                      disabled={busy}
                      className="size-11 shrink-0 items-center justify-center text-card-lighter-2"
                      onPress={() =>
                        update.mutate(
                          {
                            id: item.id,
                            revision: item.revision,
                            deleted: true,
                          },
                          { onSuccess: setRemoved },
                        )
                      }
                    >
                      <RiDeleteBinLine size={16} />
                    </Pressable>
                  </>
                ) : null}
              </>
            )}
          </div>
        ))}
      </div>
      {removed && editable ? (
        <div
          role="status"
          className="flex items-center justify-between text-sm text-card-lighter-2"
        >
          <span>Subtask removed</span>
          <Pressable
            type="button"
            className="min-h-11 items-center px-3 font-bold text-white"
            disabled={busy}
            onPress={() =>
              update.mutate(
                { id: removed.id, revision: removed.revision, deleted: false },
                { onSuccess: () => setRemoved(null) },
              )
            }
          >
            Undo
          </Pressable>
        </div>
      ) : null}
      {editable && !query.isPending && !query.isError && items.length < 100 ? (
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => void add(event)}
        >
          <input
            aria-label="New subtask"
            placeholder="Add a subtask"
            maxLength={500}
            autoFocus={!items.length}
            className="min-h-12 min-w-0 flex-1 rounded-xl bg-card-light px-3 text-base text-white placeholder:text-card-lighter-3"
            value={title}
            onChange={(event) =>
              store.update({ title: event.target.value, error: null })
            }
            disabled={busy}
          />
          <Pressable
            type="submit"
            accessibilityLabel="Add subtask"
            disabled={busy || !title.trim()}
            className="size-12 shrink-0 items-center justify-center rounded-full bg-white text-black active:scale-95 motion-reduce:transform-none"
          >
            <RiAddLine size={23} />
          </Pressable>
        </form>
      ) : null}
      {items.length ? (
        <p className="text-xs text-card-lighter-3">
          Subtasks help you plan. Record the task’s progress separately.
        </p>
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-danger-400">
          {state.error}
        </p>
      ) : null}
    </section>
  )
}
