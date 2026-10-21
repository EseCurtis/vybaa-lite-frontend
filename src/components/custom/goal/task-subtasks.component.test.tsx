// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { goalSubtaskAPI } from '@/shared/api/goal-subtask.api'
import type { GoalSubtask } from '@/shared/api/goal-subtask.api'
import { TaskSubtasks } from './task-subtasks.component'
import { createSubtaskDraft } from '@/shared/goal/subtask-draft'

vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ error: vi.fn() }),
}))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => ({ dismiss: vi.fn() }),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('prevents native submission, retains failed drafts across reopening and reuses the retry ID', async () => {
  vi.spyOn(goalSubtaskAPI, 'list').mockResolvedValue([])
  const create = vi
    .spyOn(goalSubtaskAPI, 'create')
    .mockRejectedValueOnce(new Error('Network unavailable'))
    .mockResolvedValue({
      id: 'saved',
      title: 'Read a page',
      revision: 0,
      completedAt: null,
      deletedAt: null,
      createdAt: '2026-10-21T08:00:00Z',
    })
  const draft = createSubtaskDraft()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function ui() {
    return (
      <QueryClientProvider client={client}>
        <TaskSubtasks
          goal={{ id: 'task', status: 'ACTIVE', archivedAt: null }}
          draft={draft}
        />
      </QueryClientProvider>
    )
  }
  const view = render(ui())
  const input = await screen.findByLabelText('New subtask')
  fireEvent.change(input, { target: { value: 'Read a page' } })
  const form = input.closest('form')
  expect(form).not.toBeNull()
  if (!form) throw new Error('Missing subtask form')
  const submission = new Event('submit', { bubbles: true, cancelable: true })
  fireEvent(form, submission)
  expect(submission.defaultPrevented).toBe(true)
  await screen.findByRole('alert')
  const firstRequest = create.mock.calls[0]?.[1]
  view.unmount()
  render(ui())
  expect(screen.getByLabelText('New subtask').getAttribute('value')).toBe(
    'Read a page',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }))
  await screen.findByText('Read a page')
  expect(create.mock.calls[1]?.[1]).toEqual(firstRequest)
  expect(draft.getSnapshot().title).toBe('')
  client.clear()
})

it('locks simultaneous submissions and preserves a pending draft while the sheet is closed', async () => {
  vi.spyOn(goalSubtaskAPI, 'list').mockResolvedValue([])
  let finish: (value: GoalSubtask) => void = () => undefined
  const create = vi.spyOn(goalSubtaskAPI, 'create').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const draft = createSubtaskDraft()
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const view = render(
    <QueryClientProvider client={client}>
      <TaskSubtasks
        goal={{ id: 'task', status: 'ACTIVE', archivedAt: null }}
        draft={draft}
      />
    </QueryClientProvider>,
  )
  const input = await screen.findByLabelText('New subtask')
  fireEvent.change(input, { target: { value: 'Only once' } })
  const button = screen.getByRole('button', { name: 'Add subtask' })
  fireEvent.click(button)
  fireEvent.click(button)
  await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
  view.unmount()
  expect(draft.getSnapshot().pending).toBe(true)
  finish({
    id: 'saved',
    title: 'Only once',
    revision: 0,
    completedAt: null,
    deletedAt: null,
    createdAt: '2026-10-21T08:00:00Z',
  })
  await waitFor(() =>
    expect(draft.getSnapshot()).toMatchObject({
      title: '',
      pending: false,
      request: null,
    }),
  )
  client.clear()
})

it('adds, completes, removes and restores saved subtasks using server revisions', async () => {
  const item: GoalSubtask = {
    id: 'step-one',
    title: 'Read chapter one',
    revision: 0,
    completedAt: null,
    createdAt: '2026-10-20T08:00:00Z',
    deletedAt: null,
  }
  vi.spyOn(goalSubtaskAPI, 'list').mockResolvedValue([])
  const create = vi.spyOn(goalSubtaskAPI, 'create').mockResolvedValue(item)
  let saved = item
  const update = vi
    .spyOn(goalSubtaskAPI, 'update')
    .mockImplementation(async (_goalId, _id, input) => {
      saved = {
        ...saved,
        revision: input.revision + 1,
        ...(input.completed === undefined
          ? {}
          : { completedAt: input.completed ? '2026-10-20T09:00:00Z' : null }),
        ...(input.deleted === undefined
          ? {}
          : { deletedAt: input.deleted ? '2026-10-20T09:01:00Z' : null }),
      }
      return saved
    })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <TaskSubtasks
        goal={{ id: 'task-one', status: 'ACTIVE', archivedAt: null }}
      />
    </QueryClientProvider>,
  )
  await screen.findByLabelText('New subtask')
  fireEvent.change(screen.getByLabelText('New subtask'), {
    target: { value: item.title },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add subtask' }))
  await screen.findByText(item.title)
  expect(create).toHaveBeenCalledWith('task-one', {
    id: expect.any(String),
    title: item.title,
  })
  fireEvent.click(
    screen.getByRole('button', { name: `Complete ${item.title}` }),
  )
  await screen.findByRole('button', { name: `Reopen ${item.title}` })
  expect(update).toHaveBeenLastCalledWith('task-one', item.id, {
    revision: 0,
    completed: true,
  })
  fireEvent.click(screen.getByRole('button', { name: `Remove ${item.title}` }))
  await screen.findByText('Subtask removed')
  expect(screen.queryByText(item.title)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
  await screen.findByText(item.title)
  expect(update).toHaveBeenLastCalledWith('task-one', item.id, {
    revision: 2,
    deleted: false,
  })
  await waitFor(() => expect(screen.getByText('1/1')).toBeTruthy())
})
