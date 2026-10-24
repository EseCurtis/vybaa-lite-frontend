// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { reflectionsAPI } from '@/shared/api/reflections.api'
import type {
  DailyReflection,
  ReflectionDaysPage,
} from '@/shared/api/reflections.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import { useDailyReflection } from './use-reflection-days.hook'

const auth = vi.hoisted(() => ({ id: 'owner' }))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: { id: auth.id } }),
}))
const reflection: DailyReflection = {
  id: 'day',
  localDateKey: '2026-10-24',
  timezone: 'Africa/Lagos',
  state: 'READY',
  summary: 'Saved summary',
  insights: [],
  participantIds: [],
  sourceCounts: {},
  analyzedAt: '2026-10-24T09:00:00Z',
  updatedAt: '2026-10-24T09:00:00Z',
  processing: false,
}
let client: QueryClient
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  auth.id = 'owner'
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

it('reuses the matching owner’s archive data while fetching an abortable detail request', async () => {
  client.setQueryData(rewindQueryKeys.reflections(auth.id), {
    pages: [
      {
        today: '2026-10-24',
        timezone: 'Africa/Lagos',
        days: [{ dayKey: reflection.localDateKey, reflection, sessions: [] }],
        upcomingSessions: [],
        nextCursor: null,
      } satisfies ReflectionDaysPage,
    ],
    pageParams: [null],
  })
  const read = vi
    .spyOn(reflectionsAPI, 'day')
    .mockResolvedValue({ ...reflection, summary: 'Updated summary' })
  const hook = renderHook(() => useDailyReflection(reflection.localDateKey), {
    wrapper,
  })
  expect(hook.result.current.data?.summary).toBe('Saved summary')
  await waitFor(() =>
    expect(hook.result.current.data?.summary).toBe('Updated summary'),
  )
  expect(read).toHaveBeenCalledOnce()
  expect(read.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal)
})

it('does not fetch invalid dates or reuse another account’s cached detail', async () => {
  client.setQueryData(
    rewindQueryKeys.dailyReflection('other', reflection.localDateKey),
    reflection,
  )
  const read = vi.spyOn(reflectionsAPI, 'day').mockResolvedValue(reflection)
  const invalid = renderHook(() => useDailyReflection('2026-02-30'), {
    wrapper,
  })
  expect(invalid.result.current.data).toBeUndefined()
  expect(read).not.toHaveBeenCalled()
  invalid.unmount()
  const hook = renderHook(() => useDailyReflection(reflection.localDateKey), {
    wrapper,
  })
  expect(hook.result.current.data).toBeUndefined()
  await waitFor(() => expect(hook.result.current.isSuccess).toBe(true))
  expect(read).toHaveBeenCalledOnce()
})
