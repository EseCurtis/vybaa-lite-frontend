// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { goalAPI } from '@/shared/api/goal.api'
import type { Goal } from '@/shared/api/goal.api'
import { uploadAPI } from '@/shared/api/upload.api'
import {
  createTaskProgressDraft,
  TaskProgressSheet,
} from './task-progress-sheet.component'
import { TaskListRow } from './task-list-row.component'
import { taskFixture } from './task-test.fixture'

const controls = vi.hoisted(() => ({
  dismiss: vi.fn(),
  present: vi.fn(),
  saved: vi.fn(),
}))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => controls,
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
vi.mock('@/shared/goal/goal-alarm.service', () => ({
  requestGoalAlarmSync: async () => undefined,
}))
let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})
function ui(goal: Goal, draft = createTaskProgressDraft()): ReactElement {
  return (
    <QueryClientProvider client={client}>
      <TaskProgressSheet goal={goal} draft={draft} onSaved={controls.saved} />
    </QueryClientProvider>
  )
}

it('opens the entry sheet from a list checkbox without recording progress automatically', () => {
  const record = vi.spyOn(goalAPI, 'recordProgress')
  render(
    <QueryClientProvider client={client}>
      <TaskListRow goal={taskFixture} onOpen={vi.fn()} />
    </QueryClientProvider>,
  )
  fireEvent.click(
    screen.getByRole('button', {
      name: `Record progress for ${taskFixture.title}`,
    }),
  )
  expect(controls.present).toHaveBeenCalledOnce()
  expect(record).not.toHaveBeenCalled()
  expect(screen.getByText('Due today').className).toContain('text-warning-400')
})

it('preserves an unsuccessful draft across sheet reopening, and clears it only after a successful save', async () => {
  const record = vi
    .spyOn(goalAPI, 'recordProgress')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ msg: 'ok', data: taskFixture })
  const draft = createTaskProgressDraft()
  const view = render(ui(taskFixture, draft))
  fireEvent.change(screen.getByLabelText('Progress note'), {
    target: { value: 'A good start' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
  await screen.findByRole('alert')
  expect(controls.dismiss).not.toHaveBeenCalled()
  view.unmount()
  render(ui(taskFixture, draft))
  expect(screen.getByLabelText('Progress note').textContent).toBe(
    'A good start',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
  await waitFor(() => expect(controls.dismiss).toHaveBeenCalledOnce())
  expect(record).toHaveBeenLastCalledWith('task-one', 'occurrence-one', {
    amount: undefined,
    notes: 'A good start',
    attachments: [],
  })
  expect(draft.getSnapshot().notes).toBe('')
  expect(controls.saved).toHaveBeenCalledWith(taskFixture)
})

it('validates quantity, includes uploaded image/audio attachments, and blocks duplicate saves', async () => {
  const quantity: Goal = {
    ...taskFixture,
    target: { type: 'QUANTITY', amount: 40, unit: 'pages' },
  }
  const record = vi
    .spyOn(goalAPI, 'recordProgress')
    .mockResolvedValue({ msg: 'ok', data: quantity })
  vi.spyOn(uploadAPI, 'uploadImage').mockResolvedValue({
    msg: 'ok',
    data: { url: 'https://example.test/photo.png', publicId: 'test-photo' },
  })
  const draft = createTaskProgressDraft()
  draft.update({
    attachments: [
      {
        type: 'audio',
        url: 'https://example.test/audio.mp3',
        name: 'Voice note',
      },
    ],
  })
  render(ui(quantity, draft))
  const save = screen.getByRole('button', { name: 'Save progress' })
  expect(save.hasAttribute('disabled')).toBe(true)
  fireEvent.change(screen.getByLabelText('Progress amount'), {
    target: { value: '5' },
  })
  const input = document.querySelector<HTMLInputElement>(
    'input[type="file"][accept="image/*"]',
  )
  if (!input) throw new Error('Missing image attachment input')
  fireEvent.change(input, {
    target: {
      files: [new File(['sample'], 'photo.png', { type: 'image/png' })],
    },
  })
  await screen.findByAltText('photo.png')
  await waitFor(() => expect(save.hasAttribute('disabled')).toBe(false))
  fireEvent.click(save)
  fireEvent.click(save)
  await waitFor(() => expect(record).toHaveBeenCalledOnce())
  expect(record.mock.calls[0]?.[2]).toMatchObject({
    amount: 5,
    attachments: [{ type: 'audio' }, { type: 'image', publicId: 'test-photo' }],
  })
})

it('does not dismiss a different sheet or navigate after a pending save finishes while closed', async () => {
  let finish: (value: { msg: string; data: Goal }) => void = () => undefined
  vi.spyOn(goalAPI, 'recordProgress').mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const draft = createTaskProgressDraft()
  const view = render(ui(taskFixture, draft))
  fireEvent.change(screen.getByLabelText('Progress note'), {
    target: { value: 'Finish in the background' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save progress' }))
  await waitFor(() => expect(draft.getSnapshot().pending).toBe(true))
  view.unmount()
  finish({ msg: 'ok', data: taskFixture })
  await waitFor(() => expect(draft.getSnapshot().pending).toBe(false))
  expect(draft.getSnapshot().notes).toBe('')
  expect(controls.dismiss).not.toHaveBeenCalled()
  expect(controls.saved).not.toHaveBeenCalled()
})
