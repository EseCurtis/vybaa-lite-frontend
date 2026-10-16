// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { rewindAPI } from '@/shared/api/rewind.api'
import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import { RewindCountdownTimer } from './rewind-countdown-timer.component'

vi.mock('@/shared/api/rewind.api', () => ({
  rewindAPI: { getRoutine: vi.fn() },
}))

const target = Date.parse('2026-10-16T11:00:00Z')
const overview: RewindRoutineOverview = {
  timezone: 'Africa/Lagos',
  currentSession: null,
  latestSession: null,
  routine: {
    id: 'routine',
    frequency: 'JUST_MORNINGS',
    times: ['12:00'],
    intent: 'SPOT_PATTERNS',
    customIntent: null,
    enabled: true,
    createdAt: '',
    updatedAt: '',
  },
  nextSession: {
    id: 'today',
    status: 'SCHEDULED',
    scheduledFor: '2026-10-16T11:00:00Z',
    windowEndsAt: '2026-10-16T12:00:00Z',
  },
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(target - 2000)
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.resetAllMocks()
})

it('renders only numbers, ticks live, and refreshes at opening without lingering at zero', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  vi.mocked(rewindAPI.getRoutine).mockResolvedValue({
    msg: 'ok',
    data: overview,
  })
  const { container } = render(
    <QueryClientProvider client={client}>
      <RewindCountdownTimer />
    </QueryClientProvider>,
  )
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10)
  })
  expect(screen.getByRole('timer').textContent).toBe('00:00:02')
  expect(container.querySelector('svg')).toBeNull()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1000)
  })
  expect(screen.getByRole('timer').textContent).toBe('00:00:01')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1100)
  })
  expect(screen.queryByRole('timer')).toBeNull()
  expect(rewindAPI.getRoutine).toHaveBeenCalledTimes(2)
  client.clear()
})

it('does not display an invented timer when the schedule cannot be loaded', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  vi.mocked(rewindAPI.getRoutine).mockRejectedValue(new Error('Offline'))
  render(
    <QueryClientProvider client={client}>
      <RewindCountdownTimer />
    </QueryClientProvider>,
  )
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10)
  })
  expect(screen.queryByRole('timer')).toBeNull()
  client.clear()
})
