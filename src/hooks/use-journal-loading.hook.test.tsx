// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { journalAPI } from '@/shared/api/journal.api'
import type { JournalPageResponse } from '@/shared/api/journal.api'
import { useJournalsInfinite, usePaginatedJournals } from './use-journal.hook'

vi.mock('@/shared/api/journal.api', () => ({
  journalAPI: { getJournals: vi.fn(), getJournalsPage: vi.fn() },
}))
afterEach(() => vi.resetAllMocks())

function page(number: number, hasMore = false): JournalPageResponse {
  return {
    msg: 'ok',
    data: [
      {
        id: `journal-${number}`,
        userId: 'user',
        date: '2026-10-16',
        entry: `Page ${number}`,
        createdAt: '',
      },
    ],
    pagination: { page: number, limit: 20, total: 40, totalPages: 2, hasMore },
  }
}

it('retains the previous page during navigation, then replaces it with the requested page', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  let resolveNext: (value: JournalPageResponse) => void = () => {
    throw new Error('Not started')
  }
  const next = new Promise<JournalPageResponse>((resolve) => {
    resolveNext = resolve
  })
  vi.mocked(journalAPI.getJournals)
    .mockResolvedValueOnce(page(1, true))
    .mockReturnValueOnce(next)
  const { result, rerender } = renderHook(
    ({ current }) => usePaginatedJournals(current, 20),
    {
      initialProps: { current: 1 },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  await waitFor(() => expect(result.current.data?.pagination.page).toBe(1))
  rerender({ current: 2 })
  expect(result.current.data?.pagination.page).toBe(1)
  expect(result.current.isPlaceholderData).toBe(true)
  await act(async () => resolveNext(page(2)))
  await waitFor(() => expect(result.current.data?.pagination.page).toBe(2))
  client.clear()
})

it('uses server pagination and only requests another page when asked', async () => {
  const client = new QueryClient()
  vi.mocked(journalAPI.getJournalsPage)
    .mockResolvedValueOnce(page(1, true))
    .mockResolvedValueOnce(page(2))
  const { result } = renderHook(() => useJournalsInfinite(20), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  await waitFor(() => expect(result.current.hasNextPage).toBe(true))
  expect(journalAPI.getJournalsPage).toHaveBeenCalledTimes(1)
  await act(async () => {
    await result.current.fetchNextPage()
  })
  await waitFor(() =>
    expect(
      result.current.data?.pages.map((item) => item.pagination.page),
    ).toEqual([1, 2]),
  )
  expect(result.current.hasNextPage).toBe(false)
  client.clear()
})
