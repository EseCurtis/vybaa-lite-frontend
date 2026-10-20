import { RiAddLine } from '@remixicon/react'
import { useState } from 'react'
import type { FormEvent, ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'
import { useCreateGoal } from '@/hooks/use-goals.hook'
import { useProAccess } from '@/hooks/use-pro-access.hook'
import type { CreateGoalRequest } from '@/shared/api/goal.api'
import { randomCreateGoalPlaceholder } from '@/shared/goal/goal.util.shared'

function todayKey(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function TaskQuickAdd({
  onCreated,
}: {
  onCreated: (id: string) => void
}): ReactElement {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(todayKey)
  const [placeholder] = useState(randomCreateGoalPlaceholder)
  const create = useCreateGoal()
  const { handleSubscriptionError } = useProAccess()
  async function add(event: FormEvent): Promise<void> {
    event.preventDefault()
    if (!title.trim() || !date || create.isPending) return
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
      setTitle('')
      onCreated(result.data.id)
    }
    try {
      await submit()
    } catch (error: unknown) {
      await handleSubscriptionError(error, submit)
    }
  }
  return (
    <form
      onSubmit={(event) => void add(event)}
      className="mb-4 rounded-2xl bg-card-light-50 p-3"
    >
      <label
        htmlFor="quick-task-title"
        className="text-xs font-bold text-card-lighter-2"
      >
        Quick task
      </label>
      <input
        id="quick-task-title"
        value={title}
        maxLength={500}
        disabled={create.isPending}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={placeholder}
        className="mt-1 min-h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-card-lighter-3"
      />
      <div className="flex items-center justify-between gap-3">
        <input
          aria-label="Task due date"
          type="date"
          min={todayKey()}
          value={date}
          disabled={create.isPending}
          className="min-h-11 min-w-0 rounded-lg bg-card-light px-2 text-xs text-card-lighter-2 [color-scheme:dark]"
          onChange={(event) => setDate(event.target.value)}
        />
        <Pressable
          accessibilityLabel="Add quick task"
          type="submit"
          disabled={!title.trim() || !date || create.isPending}
          className="min-h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-4 text-sm font-bold text-black"
        >
          <RiAddLine size={18} /> {create.isPending ? 'Adding…' : 'Add'}
        </Pressable>
      </div>
    </form>
  )
}
