import { RiArrowDownLine, RiArrowUpLine, RiRefreshLine } from '@remixicon/react'
import { useRef, useState } from 'react'
import type { ReactElement } from 'react'

import { QueryFeedback } from '@/components/common/query-feedback.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { Pressable } from '@/components/layout/pressables.component'
import {
  useCorrectGoalProgress,
  useUndoGoalProgress,
} from '@/hooks/use-goals.hook'
import { useGoalTimeline } from '@/hooks/use-goal-timeline.hook'
import { useTimelineScroll } from '@/hooks/use-timeline-scroll.hook'
import { useAuth } from '@/providers/auth.provider'
import type { Goal, GoalOccurrence } from '@/shared/api/goal.api'
import { seededColor } from '@/shared/utils/helpers.util'

function occurrenceStatus(
  item: GoalOccurrence,
  today: string,
): { label: string; tone: string } {
  if (item.status === 'COMPLETED')
    return { label: 'Completed', tone: 'text-success-400' }
  if (item.status === 'MISSED')
    return { label: 'Missed', tone: 'text-danger-400' }
  if (item.status === 'CANCELLED')
    return { label: 'Cancelled', tone: 'text-card-lighter-3' }
  if (item.status === 'GRACE')
    return { label: 'Grace window', tone: 'text-warning-400' }
  if (item.dueDate.slice(0, 10) < today)
    return { label: 'Overdue', tone: 'text-danger-400' }
  if (item.dueDate.slice(0, 10) === today)
    return { label: 'Today', tone: 'text-warning-400' }
  return { label: 'Upcoming', tone: 'text-card-lighter-3' }
}

export function TaskTimeline({
  goal,
  active,
}: {
  goal: Goal
  active: boolean
}): ReactElement {
  const query = useGoalTimeline(goal.id, active)
  const content = useRef<HTMLElement>(null)
  const { user } = useAuth()
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: user?.timezone ?? undefined,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const scroll = useTimelineScroll(content, {
    active,
    firstId: query.items[0]?.id,
    fetching: query.isFetching,
    hasBefore: query.hasPreviousPage,
    hasAfter: query.hasNextPage,
    beforeFailed: query.isFetchPreviousPageError,
    afterFailed: query.isFetchNextPageError,
    loadBefore: () => query.fetchPreviousPage(),
    loadAfter: () => query.fetchNextPage(),
  })
  const correction = useCorrectGoalProgress()
  const undo = useUndoGoalProgress()
  const [editing, setEditing] = useState<GoalOccurrence | null>(null)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  async function saveCorrection(): Promise<void> {
    if (!editing || correction.isPending) return
    try {
      await correction.mutateAsync({
        goalId: goal.id,
        occurrenceId: editing.id,
        amount: goal.target.type === 'QUANTITY' ? Number(amount) : undefined,
        notes,
      })
      setEditing(null)
      setError(null)
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not save this correction.',
      )
    }
  }
  async function undoEntry(id: string): Promise<void> {
    if (
      !confirm(
        'Undo this progress entry? This is only allowed before today closes.',
      )
    )
      return
    try {
      await undo.mutateAsync({ goalId: goal.id, occurrenceId: id })
      setError(null)
    } catch (failure: unknown) {
      setError(
        failure instanceof Error
          ? failure.message
          : 'Could not undo this entry.',
      )
    }
  }
  function pageBoundary(direction: 'after' | 'before'): ReactElement {
    const before = direction === 'before'
    const failed = before
      ? query.isFetchPreviousPageError
      : query.isFetchNextPageError
    const pending = before
      ? query.isFetchingPreviousPage
      : query.isFetchingNextPage
    const available = before ? query.hasPreviousPage : query.hasNextPage
    return (
      <div data-timeline-edge={direction} className="min-h-11 py-1">
        {failed ? (
          <QueryFeedback
            message={`${before ? 'Earlier' : 'Later'} entries couldn’t load.`}
            onRetry={() => void scroll.loadPage(direction, true)}
            retrying={pending}
          />
        ) : pending ? (
          <Skeleton className="h-14 w-full" />
        ) : available ? (
          <Pressable
            type="button"
            onPress={() => void scroll.loadPage(direction)}
            className="sr-only focus:not-sr-only focus:min-h-11 items-center gap-2 text-xs text-card-lighter-3"
            accessibilityLabel={`Load ${before ? 'earlier' : 'later'} timeline entries`}
          >
            {before ? (
              <RiArrowUpLine size={14} aria-hidden="true" />
            ) : (
              <RiArrowDownLine size={14} aria-hidden="true" />
            )}{' '}
            {before ? 'Earlier' : 'Later'}
          </Pressable>
        ) : null}
      </div>
    )
  }
  const anchor = query.anchorDate
  const beforeItems = query.items.filter(
    (item) => anchor && item.dueDate.slice(0, 10) < anchor,
  )
  const afterItems = query.items.filter(
    (item) => !anchor || item.dueDate.slice(0, 10) >= anchor,
  )
  function row(item: GoalOccurrence): ReactElement {
    const status = occurrenceStatus(item, today)
    const isToday = item.dueDate.slice(0, 10) === today
    const editable =
      goal.status === 'ACTIVE' && item.status === 'COMPLETED' && isToday
    const moved =
      item.originalDueDate.slice(0, 10) !== item.dueDate.slice(0, 10)
    const date = new Date(`${item.dueDate.slice(0, 10)}T12:00:00`)
    const loggedLabel =
      goal.target.type === 'QUANTITY'
        ? `${item.progress?.amount.toLocaleString()} ${goal.target.unit ?? 'units'} logged`
        : 'Check-in logged'
    return (
      <article key={item.id} data-occurrence-id={item.id} className="py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {date.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </h3>
          <span className={`text-xs font-semibold ${status.tone}`}>
            {status.label}
          </span>
        </div>
        {item.progress ? (
          <div className="mt-2 space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: seededColor(loggedLabel) }}
              />
              {loggedLabel}
            </p>
            {item.progress.notes ? (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-card-lighter-3">
                {item.progress.notes}
              </p>
            ) : null}
            {item.progress.attachments?.map((attachment) =>
              attachment.type === 'image' ? (
                <img
                  key={attachment.url}
                  src={attachment.url}
                  alt={attachment.name ?? 'Progress attachment'}
                  className="max-h-48 max-w-full rounded-xl object-contain"
                />
              ) : (
                <audio
                  key={attachment.url}
                  src={attachment.url}
                  controls
                  className="max-w-full"
                />
              ),
            )}
          </div>
        ) : null}
        {moved ? (
          <p className="mt-2 text-xs text-card-lighter-3">
            Moved from{' '}
            {new Date(
              `${item.originalDueDate.slice(0, 10)}T12:00:00`,
            ).toLocaleDateString()}
          </p>
        ) : null}
        {editable ? (
          <div className="mt-1 flex gap-4">
            <Pressable
              type="button"
              className="min-h-11 items-center text-xs font-semibold text-white"
              onPress={() => {
                setEditing(item)
                setAmount(String(item.progress?.amount ?? 1))
                setNotes(item.progress?.notes ?? '')
                setError(null)
              }}
            >
              Edit entry
            </Pressable>
            <Pressable
              type="button"
              disabled={undo.isPending}
              className="min-h-11 items-center text-xs font-semibold text-danger-400"
              onPress={() => void undoEntry(item.id)}
            >
              Undo
            </Pressable>
          </div>
        ) : null}
        {editing?.id === item.id ? (
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              void saveCorrection()
            }}
          >
            {goal.target.type === 'QUANTITY' ? (
              <input
                aria-label="Correct progress amount"
                type="number"
                step="any"
                min="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="min-h-11 w-full rounded-xl bg-card-light px-3 text-white"
              />
            ) : null}
            <input
              aria-label="Correct progress notes"
              maxLength={2000}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-11 w-full rounded-xl bg-card-light px-3 text-white"
            />
            <div className="flex gap-3">
              <Pressable
                type="submit"
                disabled={
                  correction.isPending ||
                  (goal.target.type === 'QUANTITY' &&
                    (!Number.isFinite(Number(amount)) || Number(amount) <= 0))
                }
                className="min-h-11 items-center rounded-full bg-white px-4 text-sm font-bold text-black"
              >
                Save correction
              </Pressable>
              <Pressable
                type="button"
                className="min-h-11 items-center px-3 text-sm text-card-lighter-3"
                onPress={() => setEditing(null)}
              >
                Cancel
              </Pressable>
            </div>
          </form>
        ) : null}
      </article>
    )
  }
  return (
    <section
      ref={content}
      hidden={!active}
      aria-label="Task timeline"
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Timeline</h2>
        <Pressable
          type="button"
          accessibilityLabel="Refresh timeline around today"
          className="min-h-11 min-w-11 items-center justify-center text-card-lighter-3"
          onPress={query.refresh}
        >
          <RiRefreshLine size={18} />
        </Pressable>
      </div>
      {query.isPending ? (
        <div className="space-y-3" aria-label="Loading timeline">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}
      {query.isError && !query.data ? (
        <QueryFeedback
          message="Your timeline couldn’t load."
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : null}
      {query.data ? (
        <>
          {pageBoundary('before')}
          {beforeItems.map(row)}
          <div
            data-timeline-today
            className="py-2 text-xs font-bold text-warning-400"
          >
            {anchor === today ? 'Today' : anchor}
          </div>
          {!afterItems.some((item) => item.dueDate.slice(0, 10) === anchor) ? (
            <p className="pb-2 text-sm text-card-lighter-3">
              No task scheduled for {anchor === today ? 'today' : 'this day'}.
            </p>
          ) : null}
          {afterItems.map(row)}
          {pageBoundary('after')}
        </>
      ) : null}
      <details className="pt-4 text-sm">
        <summary className="min-h-11 cursor-pointer py-3 font-semibold text-card-lighter-3">
          Task stats
        </summary>
        <dl className="space-y-3 pb-3">
          <div className="flex justify-between gap-4">
            <dt className="text-card-lighter-3">Current streak</dt>
            <dd>{goal.progress.currentStreak}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-card-lighter-3">Longest streak</dt>
            <dd>{goal.progress.longestStreak}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-card-lighter-3">Adherence</dt>
            <dd>{Math.round(goal.progress.adherenceRate)}%</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-card-lighter-3">Completed check-ins</dt>
            <dd>{goal.progress.completedOccurrences}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-card-lighter-3">Missed check-ins</dt>
            <dd>{goal.progress.missedOccurrences}</dd>
          </div>
        </dl>
      </details>
      {error ? (
        <p role="alert" className="text-sm text-danger-400">
          {error}
        </p>
      ) : null}
    </section>
  )
}
