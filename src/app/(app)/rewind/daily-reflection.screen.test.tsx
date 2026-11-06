// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { DailyReflection } from '@/shared/api/reflections.api'
import DailyReflectionScreen from './daily-reflection.screen'

const state = vi.hoisted(() => ({ processing: false, error: false }))
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({}),
  useLocation: () => ({ pathname: '/app/reflections/2026-10-24' }),
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: { id: 'owner', rewindPersona: 'tobi' } }),
}))
vi.mock('@/hooks/use-reflection-days.hook', () => ({
  useDailyReflection: () => ({
    isPending: false,
    isError: state.error,
    refetch: vi.fn(),
    data: {
      id: 'day',
      localDateKey: '2026-10-24',
      timezone: 'Africa/Lagos',
      state: 'READY',
      summary: 'Your saved daily summary.',
      insights: ['A moment to pause.'],
      sourceCounts: { JOURNAL: 1 },
      participantIds: ['ella', 'tobi'],
      analyzedAt: '2026-10-24T09:00:00Z',
      updatedAt: '2026-10-24T09:00:00Z',
      processing: state.processing,
    } satisfies DailyReflection,
  }),
}))
afterEach(() => {
  cleanup()
  state.processing = false
  state.error = false
})

it('opens daily analysis as a page with back navigation, not a sheet', () => {
  render(<DailyReflectionScreen dayKey="2026-10-24" />)
  expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(screen.getByText('Your saved daily summary.')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'A little more' }))
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})
it('shows active processing with the selected partner and preserves the previous saved summary', () => {
  state.processing = true
  render(<DailyReflectionScreen dayKey="2026-10-24" />)
  expect(screen.getByText('Preparing summary for you…')).toBeTruthy()
  expect(screen.getByText('w/ @tobi')).toBeTruthy()
  expect(screen.getByText('Your saved daily summary.')).toBeTruthy()
})
it('retains saved content on a failed background refresh', () => {
  state.error = true
  render(<DailyReflectionScreen dayKey="2026-10-24" />)
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  expect(screen.getByText('Your saved daily summary.')).toBeTruthy()
})
