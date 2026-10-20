// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { CreateGoalSheet } from './create-goal-sheet.component'

const controls = vi.hoisted(() => ({
  create: vi.fn(),
  warning: vi.fn(),
  present: vi.fn(),
  dismiss: vi.fn(),
}))
vi.mock('@/hooks/use-goals.hook', () => ({
  useCreateGoal: () => ({ mutateAsync: controls.create, isPending: false }),
}))
vi.mock('@/hooks/use-pro-access.hook', () => ({
  useProAccess: () => ({ handleSubscriptionError: vi.fn() }),
}))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ warning: controls.warning, error: vi.fn() }),
}))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => controls,
}))
vi.mock('@/shared/haptic.util', () => ({ hapticFeedback: { light: vi.fn() } }))

beforeEach(() => {
  localStorage.clear()
  controls.create.mockReset()
  controls.create.mockResolvedValue({ data: { id: 'created' } })
})
afterEach(cleanup)

it('submits Finish once as a real one-time completion while keeping count inputs when switching choices', async () => {
  render(
    <CreateGoalSheet
      initialStep={2}
      initialValues={{
        title: 'Read a chapter',
        target: { type: 'QUANTITY', amount: 42, unit: 'pages' },
        schedule: { type: 'DAILY', startDate: '2026-10-20' },
      }}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: /Finish once/ }))
  expect(screen.queryByRole('spinbutton')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /^Count/ }))
  expect(screen.getByRole('spinbutton').getAttribute('value')).toBe('42')
  fireEvent.click(screen.getByRole('button', { name: /Finish once/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(screen.queryByRole('button', { name: 'Weekly' })).toBeNull()
  expect(screen.queryByText('Ends', { exact: true })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Review' }))
  fireEvent.click(screen.getByRole('button', { name: 'Create task' }))
  await waitFor(() => expect(controls.create).toHaveBeenCalledOnce())
  expect(controls.create.mock.calls[0]?.[0]).toMatchObject({
    title: 'Read a chapter',
    target: { type: 'CHECK_IN_COUNT', count: 1 },
    schedule: { type: 'ONE_TIME', date: '2026-10-20' },
    hardStopDate: '2026-10-20',
  })
})

it('preserves existing date-adherence drafts as recurring routines', () => {
  render(
    <CreateGoalSheet
      initialStep={2}
      initialValues={{
        title: 'Read daily',
        target: { type: 'UNTIL_DATE', endDate: '2026-11-01' },
        schedule: { type: 'DAILY', startDate: '2026-10-20' },
      }}
    />,
  )
  expect(
    screen
      .getByRole('button', { name: /Stay consistent/ })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  expect(
    screen
      .getByRole('button', { name: /Finish once/ })
      .getAttribute('aria-pressed'),
  ).toBe('false')
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  expect(screen.getByRole('button', { name: 'Weekly' })).toBeTruthy()
})
