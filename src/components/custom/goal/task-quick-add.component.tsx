import { RiAddLine, RiCloseLine, RiSparklingLine } from '@remixicon/react'
import { useRef, useState } from 'react'
import type { FormEvent, ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import { useQuickTaskSuggestions } from '@/hooks/use-quick-task-suggestions.hook'
import { useAuth } from '@/providers/auth.provider'
import type { CreateGoalRequest } from '@/shared/api/goal.api'
import type { QuickTaskSuggestion } from '@/shared/api/quick-task-suggestion.api'
import { randomCreateGoalPlaceholder } from '@/shared/goal/goal.util.shared'
import {
  readQuickTaskPreferences,
  saveQuickTaskPreferences,
} from '@/shared/goal/quick-task-preferences'
import type { QuickTaskPreferences } from '@/shared/goal/quick-task-preferences'

function todayKey(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TaskQuickAdd({
  onCreated,
}: {
  onCreated: (id: string) => void
}): ReactElement | null {
  const { user } = useAuth()
  if (!user) return null
  return (
    <QuickTaskComposer
      key={user.id}
      userId={user.id}
      personalized={user.rewindPersonalizationEnabled !== false}
      onCreated={onCreated}
    />
  )
}

function QuickTaskComposer({
  userId,
  personalized,
  onCreated,
}: {
  userId: string
  personalized: boolean
  onCreated: (id: string) => void
}): ReactElement {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayKey)
  const [placeholder] = useState(randomCreateGoalPlaceholder)
  const [preferences, setPreferences] = useState(() =>
    readQuickTaskPreferences(userId),
  )
  const [selected, setSelected] = useState<QuickTaskSuggestion | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const submitting = useRef(false)
  const titleInput = useRef<HTMLInputElement>(null)
  const create = useCreateGoal()
  const { handleSubscriptionError } = useProAccess()
  const suggestions = useQuickTaskSuggestions(
    userId,
    personalized && !preferences.hidden,
  )
  const visibleSuggestions = personalized
    ? (suggestions.data ?? []).filter(
        (item) => !preferences.dismissedIds.includes(item.id),
      )
    : []

  function updatePreferences(next: QuickTaskPreferences): void {
    setPreferences(next)
    saveQuickTaskPreferences(userId, next)
  }

  function dismissSuggestion(id: string): void {
    updatePreferences({
      ...preferences,
      dismissedIds: [...new Set([...preferences.dismissedIds, id])].slice(-100),
    })
  }

  async function add(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!title.trim() || !date || submitting.current) return
    submitting.current = true
    setIsSaving(true)
    const input: CreateGoalRequest = {
      title: title.trim(),
      target: { type: 'CHECK_IN_COUNT', count: 1 },
      schedule: { type: 'ONE_TIME', date },
      reminderTimes: [],
      missPolicy: { mode: 'NO_STREAK' },
      rewardReleasePolicy: 'ON_COMPLETION',
    }
    async function submit(): Promise<void> {
      const result = await create.mutateAsync(input)
      if (selected?.title === input.title) dismissSuggestion(selected.id)
      setTitle('')
      setSelected(null)
      onCreated(result.data.id)
    }
    try {
      await submit()
    } catch (error: unknown) {
      await handleSubscriptionError(error, submit)
    } finally {
      submitting.current = false
      setIsSaving(false)
    }
  }

  if (preferences.hidden) {
    return (
      <Pressable
        type="button"
        accessibilityLabel="Show quick task"
        aria-expanded={false}
        onPress={() => updatePreferences({ ...preferences, hidden: false })}
        className="mb-3 min-h-11 items-center gap-2 px-1 text-xs font-bold text-card-lighter-2"
      >
        <RiAddLine size={17} aria-hidden="true" /> Quick task
      </Pressable>
    )
  }

  return (
    <form
      onSubmit={(event) => void add(event)}
      className="mb-4 rounded-2xl bg-card-light-50 p-3"
    >
      <div className="flex min-h-11 items-center justify-between gap-2">
        <label
          htmlFor="quick-task-title"
          className="text-xs font-bold text-card-lighter-2"
        >
          Quick task
        </label>
        <Pressable
          type="button"
          accessibilityLabel="Dismiss quick task"
          disabled={isSaving}
          onPress={() => updatePreferences({ ...preferences, hidden: true })}
          className="min-h-11 min-w-11 items-center justify-center rounded-full text-card-lighter-2"
        >
          <RiCloseLine size={20} aria-hidden="true" />
        </Pressable>
      </div>
      <input
        ref={titleInput}
        id="quick-task-title"
        value={title}
        maxLength={500}
        disabled={isSaving}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-card-lighter-3"
      />
      {personalized && selected?.title === title ? (
        <p className="mb-3 text-xs leading-relaxed text-card-lighter-2">
          {selected.reason}
        </p>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Task due date"
          type="date"
          min={todayKey()}
          value={date}
          disabled={isSaving}
          className="min-h-11 min-w-0 rounded-lg bg-card-light px-2 text-xs text-card-lighter-2 [color-scheme:dark]"
          onChange={(event) => setDate(event.target.value)}
        />
        <Pressable
          accessibilityLabel="Add quick task"
          type="submit"
          disabled={!title.trim() || !date || isSaving}
          className="min-h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-black"
        >
          <RiAddLine size={18} aria-hidden="true" />{' '}
          {isSaving ? 'Adding…' : 'Add'}
        </Pressable>
      </div>
      {!title.trim() && visibleSuggestions.length ? (
        <section aria-label="AI task suggestions" className="mt-4">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-card-lighter-2">
            <RiSparklingLine size={14} aria-hidden="true" /> From your activity
          </p>
          {visibleSuggestions.map((item) => (
            <div key={item.id} className="flex items-start gap-1 py-1">
              <Pressable
                type="button"
                disabled={isSaving}
                accessibilityLabel={`Use suggestion: ${item.title}`}
                onPress={() => {
                  setSelected(item)
                  setTitle(item.title)
                  titleInput.current?.focus()
                }}
                className="min-h-11 min-w-0 flex-1 flex-col items-start justify-center gap-1 py-2 pr-1 text-left"
              >
                <span className="w-full break-words text-sm font-bold text-white">
                  {item.title}
                </span>
                <span className="w-full break-words text-xs leading-relaxed text-card-lighter-2">
                  {item.reason}
                </span>
              </Pressable>
              <Pressable
                type="button"
                disabled={isSaving}
                accessibilityLabel={`Dismiss suggestion: ${item.title}`}
                onPress={() => dismissSuggestion(item.id)}
                className="min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full text-card-lighter-2"
              >
                <RiCloseLine size={16} aria-hidden="true" />
              </Pressable>
            </div>
          ))}
        </section>
      ) : null}
      {!title.trim() &&
      personalized &&
      suggestions.isError &&
      !suggestions.data ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-card-lighter-2">
          <span>Suggestions couldn’t load. You can still add a task.</span>
          <Pressable
            type="button"
            onPress={() => void suggestions.refetch()}
            disabled={suggestions.isFetching}
            className="min-h-11 shrink-0 items-center px-2 font-bold"
            accessibilityLabel="Retry task suggestions"
          >
            Retry
          </Pressable>
        </div>
      ) : null}
    </form>
  )
}
