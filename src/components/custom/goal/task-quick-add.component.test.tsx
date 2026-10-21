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

import { quickTaskSuggestionAPI } from '@/shared/api/quick-task-suggestion.api'
import { readQuickTaskPreferences } from '@/shared/goal/quick-task-preferences'
import { TaskQuickAdd } from './task-quick-add.component'

const controls = vi.hoisted(() => ({
  userId: 'owner',
  personalized: true,
  create: vi.fn(),
  handleSubscriptionError: vi.fn(),
  created: vi.fn(),
  placeholder: vi.fn(() => 'A random existing placeholder'),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    user: {
      id: controls.userId,
      rewindPersonalizationEnabled: controls.personalized,
    },
  }),
}))
vi.mock('@/hooks/use-goals.hook', () => ({
  useCreateGoal: () => ({ mutateAsync: controls.create, isPending: false }),
}))
vi.mock('@/hooks/use-pro-access.hook', () => ({
  useProAccess: () => ({
    handleSubscriptionError: controls.handleSubscriptionError,
  }),
}))
vi.mock('@/shared/goal/goal.util.shared', () => ({
  randomCreateGoalPlaceholder: controls.placeholder,
}))

const suggestion = {
  id: 'reading',
  title: 'Read one chapter',
  reason: 'You mentioned wanting to return to reading.',
}
let client: QueryClient
function ui(): ReactElement {
  return (
    <QueryClientProvider client={client}>
      <TaskQuickAdd onCreated={controls.created} />
    </QueryClientProvider>
  )
}
beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  controls.userId = 'owner'
  controls.personalized = true
  controls.create.mockResolvedValue({ data: { id: 'created-task' } })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})

it('dismisses and restores without losing typed input/date, remembers dismissal and isolates accounts', async () => {
  vi.spyOn(quickTaskSuggestionAPI, 'list').mockResolvedValue([])
  const view = render(ui())
  fireEvent.change(screen.getByLabelText('Quick task'), {
    target: { value: 'My draft' },
  })
  fireEvent.change(screen.getByLabelText('Task due date'), {
    target: { value: '2026-12-31' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss quick task' }))
  expect(screen.queryByLabelText('Task due date')).toBeNull()
  expect(readQuickTaskPreferences('owner').hidden).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Show quick task' }))
  expect(screen.getByLabelText('Quick task').getAttribute('value')).toBe(
    'My draft',
  )
  expect(screen.getByLabelText('Task due date').getAttribute('value')).toBe(
    '2026-12-31',
  )
  expect(controls.placeholder).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss quick task' }))
  view.unmount()
  const next = render(ui())
  expect(screen.getByRole('button', { name: 'Show quick task' })).toBeTruthy()
  controls.userId = 'other'
  next.rerender(ui())
  expect(screen.getByLabelText('Quick task')).toBeTruthy()
  expect(screen.getByLabelText('Quick task').getAttribute('value')).toBe('')
})

it('uses AI suggestions only as editable drafts, preserves the chosen date and requires Add', async () => {
  const list = vi
    .spyOn(quickTaskSuggestionAPI, 'list')
    .mockResolvedValue([suggestion])
  render(ui())
  fireEvent.change(screen.getByLabelText('Task due date'), {
    target: { value: '2026-12-31' },
  })
  fireEvent.click(
    await screen.findByRole('button', {
      name: `Use suggestion: ${suggestion.title}`,
    }),
  )
  expect(controls.create).not.toHaveBeenCalled()
  expect(screen.getByLabelText('Quick task').getAttribute('value')).toBe(
    suggestion.title,
  )
  expect(screen.getByText(suggestion.reason)).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Quick task'), {
    target: { value: 'Read two chapters' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add quick task' }))
  await waitFor(() =>
    expect(controls.created).toHaveBeenCalledWith('created-task'),
  )
  expect(controls.create).toHaveBeenCalledWith({
    title: 'Read two chapters',
    target: { type: 'CHECK_IN_COUNT', count: 1 },
    schedule: { type: 'ONE_TIME', date: '2026-12-31' },
    reminderTimes: [],
    missPolicy: { mode: 'NO_STREAK' },
    rewardReleasePolicy: 'ON_COMPLETION',
  })
  expect(list).toHaveBeenCalledTimes(1)
})

it('persists suggestion dismissals across remounts without more AI requests', async () => {
  const list = vi
    .spyOn(quickTaskSuggestionAPI, 'list')
    .mockResolvedValue([suggestion])
  const view = render(ui())
  fireEvent.click(
    await screen.findByRole('button', {
      name: `Dismiss suggestion: ${suggestion.title}`,
    }),
  )
  expect(screen.queryByText(suggestion.title)).toBeNull()
  view.unmount()
  render(ui())
  expect(screen.queryByText(suggestion.title)).toBeNull()
  expect(list).toHaveBeenCalledTimes(1)
})

it('does not fetch while dismissed or opted out, even if personalized data was cached', async () => {
  const list = vi
    .spyOn(quickTaskSuggestionAPI, 'list')
    .mockResolvedValue([suggestion])
  controls.personalized = false
  client.setQueryData(['goals-v2', 'suggestions', 'owner'], [suggestion])
  const view = render(ui())
  expect(screen.queryByLabelText('AI task suggestions')).toBeNull()
  expect(list).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss quick task' }))
  view.unmount()
  controls.personalized = true
  render(ui())
  expect(list).not.toHaveBeenCalled()
})

it('renders manual entry immediately during a slow request and never overwrites an existing draft', async () => {
  let resolve: (value: (typeof suggestion)[]) => void = () => undefined
  vi.spyOn(quickTaskSuggestionAPI, 'list').mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  render(ui())
  fireEvent.change(screen.getByLabelText('Quick task'), {
    target: { value: 'Keep my draft' },
  })
  resolve([suggestion])
  await waitFor(() =>
    expect(client.getQueryData(['goals-v2', 'suggestions', 'owner'])).toEqual([
      suggestion,
    ]),
  )
  expect(screen.getByLabelText('Quick task').getAttribute('value')).toBe(
    'Keep my draft',
  )
  expect(screen.queryByLabelText('AI task suggestions')).toBeNull()
})

it('allows manual creation and retry after suggestions fail', async () => {
  vi.spyOn(quickTaskSuggestionAPI, 'list')
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue([suggestion])
  render(ui())
  fireEvent.click(
    await screen.findByRole('button', { name: 'Retry task suggestions' }),
  )
  await screen.findByRole('button', {
    name: `Use suggestion: ${suggestion.title}`,
  })
  fireEvent.change(screen.getByLabelText('Quick task'), {
    target: { value: 'Manual task' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add quick task' }))
  await waitFor(() => expect(controls.created).toHaveBeenCalled())
})

it('keeps a failed submission draft and blocks duplicate submits or dismissal while saving', async () => {
  vi.spyOn(quickTaskSuggestionAPI, 'list').mockResolvedValue([])
  let reject: (error: Error) => void = () => undefined
  controls.create.mockImplementation(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail
      }),
  )
  render(ui())
  fireEvent.change(screen.getByLabelText('Quick task'), {
    target: { value: 'Keep on failure' },
  })
  const add = screen.getByRole('button', { name: 'Add quick task' })
  fireEvent.click(add)
  fireEvent.click(add)
  expect(controls.create).toHaveBeenCalledTimes(1)
  expect(
    screen
      .getByRole('button', { name: 'Dismiss quick task' })
      .hasAttribute('disabled'),
  ).toBe(true)
  reject(new Error('Save failed'))
  await waitFor(() => expect(add.hasAttribute('disabled')).toBe(false))
  expect(screen.getByLabelText('Quick task').getAttribute('value')).toBe(
    'Keep on failure',
  )
  expect(controls.created).not.toHaveBeenCalled()
})
