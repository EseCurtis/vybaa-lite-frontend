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

vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ error: vi.fn() }),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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
