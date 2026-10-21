// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { goalTimelineAPI } from '@/shared/api/goal-timeline.api'
import type { GoalTimelineResponse } from '@/shared/api/goal-timeline.api'
import { useGoalTimeline } from './use-goal-timeline.hook'

const getRandomValues = globalThis.crypto.getRandomValues.bind(
  globalThis.crypto,
)
beforeEach(() => vi.stubGlobal('crypto', { getRandomValues }))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
function page(
  id: string,
  date: string,
  previous: string | null,
  next: string | null,
): GoalTimelineResponse {
  return {
    msg: 'ok',
    data: [
      {
        id,
        dueDate: date,
        originalDueDate: date,
        status: 'PENDING',
        closesAt: date,
        completedAt: null,
        graceEndsAt: null,
        progress: null,
        rescheduledAt: null,
      },
    ],
    pagination: {
      anchorDate: '2026-10-21',
      hasMore: Boolean(next),
      hasNextPage: Boolean(next),
      hasPreviousPage: Boolean(previous),
      nextCursor: next,
      previousCursor: previous,
    },
  }
}

it('loads only while active, pages both ways, pins the anchor, retains pages across tabs and refreshes from today', async () => {
  const list = vi
    .spyOn(goalTimelineAPI, 'list')
    .mockImplementation(async (_id, request) => {
      if (request.direction === 'before')
        return page('yesterday', '2026-10-20', null, 'today')
      if (request.direction === 'after')
        return page('tomorrow', '2026-10-22', 'today', null)
      return page('today', '2026-10-21', 'earlier', 'later')
    })
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  const hook = renderHook(({ active }) => useGoalTimeline('task', active), {
    wrapper,
    initialProps: { active: false },
  })
  expect(list).not.toHaveBeenCalled()
  hook.rerender({ active: true })
  await waitFor(() => expect(hook.result.current.items).toHaveLength(1))
  await act(async () => {
    await hook.result.current.fetchPreviousPage()
  })
  await waitFor(() => expect(hook.result.current.items).toHaveLength(2))
  await act(async () => {
    await hook.result.current.fetchNextPage()
  })
  await waitFor(() =>
    expect(hook.result.current.items.map((item) => item.id)).toEqual([
      'yesterday',
      'today',
      'tomorrow',
    ]),
  )
  expect(list.mock.calls[1]?.[2]).toBe('2026-10-21')
  hook.rerender({ active: false })
  hook.rerender({ active: true })
  expect(list).toHaveBeenCalledTimes(3)
  act(() => hook.result.current.refresh())
  await waitFor(() => expect(list).toHaveBeenCalledTimes(4))
  expect(list.mock.calls[3]?.[1]).toEqual({})
  expect(list.mock.calls[3]?.[2]).toBeUndefined()
  hook.unmount()
  client.clear()
})

it('keeps loaded entries after a boundary failure and deduplicates overlapping responses', async () => {
  const list = vi
    .spyOn(goalTimelineAPI, 'list')
    .mockResolvedValueOnce(page('today', '2026-10-21', 'previous', null))
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(page('today', '2026-10-21', null, null))
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  const hook = renderHook(() => useGoalTimeline('task', true), { wrapper })
  await waitFor(() => expect(hook.result.current.items).toHaveLength(1))
  await act(async () => {
    await hook.result.current.fetchPreviousPage()
  })
  await waitFor(() =>
    expect(hook.result.current.isFetchPreviousPageError).toBe(true),
  )
  expect(hook.result.current.items).toHaveLength(1)
  await act(async () => {
    await hook.result.current.fetchPreviousPage()
  })
  expect(hook.result.current.items).toHaveLength(1)
  expect(list).toHaveBeenCalledTimes(3)
  hook.unmount()
  client.clear()
})
