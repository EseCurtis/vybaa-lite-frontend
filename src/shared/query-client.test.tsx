// @vitest-environment jsdom
import {
  QueryClientProvider,
  onlineManager,
  useQuery,
} from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { ApiError } from '@/shared/api/http'
import { createAppQueryClient, shouldRetryQuery } from './query-client'

afterEach(() => {
  cleanup()
  onlineManager.setOnline(true)
})

it('deduplicates concurrent requests and reuses fresh data across navigation', async () => {
  const client = createAppQueryClient()
  const request = vi.fn(async () => ({ title: 'Saved goal' }))
  const options = { queryKey: ['dedupe'], queryFn: request }
  const [first, second] = await Promise.all([
    client.fetchQuery(options),
    client.fetchQuery(options),
  ])
  expect(first).toEqual(second)
  await client.fetchQuery(options)
  expect(request).toHaveBeenCalledTimes(1)
  client.clear()
})

it('keeps cached content visible during background revalidation and failure', async () => {
  const client = createAppQueryClient()
  client.setQueryData(['cached'], 'Saved content', {
    updatedAt: Date.now() - 60_000,
  })
  let rejectRequest: (error: Error) => void = () => {
    throw new Error('Request not started')
  }
  const response = new Promise<string>((_resolve, reject) => {
    rejectRequest = reject
  })
  const { result } = renderHook(
    () => {
      const query = useQuery({
        queryKey: ['cached'],
        queryFn: () => response,
        retry: false,
      })
      return {
        data: query.data,
        isPending: query.isPending,
        isError: query.isError,
      }
    },
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  expect(result.current.data).toBe('Saved content')
  expect(result.current.isPending).toBe(false)
  await act(async () => {
    rejectRequest(new Error('Network interrupted'))
  })
  await waitFor(() => expect(result.current.isError).toBe(true))
  expect(result.current.data).toBe('Saved content')
  client.clear()
})

it('renders a completed resource while another is slow and a third fails', async () => {
  const client = createAppQueryClient()
  const { result, unmount } = renderHook(
    () => ({
      fast: useQuery({
        queryKey: ['fast'],
        queryFn: async () => 'Home is ready',
      }),
      slow: useQuery({
        queryKey: ['slow'],
        queryFn: () => new Promise<string>(() => undefined),
      }),
      failed: useQuery({
        queryKey: ['failed'],
        queryFn: async () => {
          throw new Error('Unavailable')
        },
        retry: false,
      }),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  await waitFor(() => expect(result.current.fast.data).toBe('Home is ready'))
  await waitFor(() => expect(result.current.failed.isError).toBe(true))
  expect(result.current.slow.isPending).toBe(true)
  unmount()
  client.clear()
})

it('cancels abandoned queries and does not retry authorization errors', async () => {
  const client = createAppQueryClient()
  let cancelled = false
  const { unmount } = renderHook(
    () =>
      useQuery({
        queryKey: ['cancel'],
        queryFn: ({ signal }) =>
          new Promise<string>((_resolve, reject) => {
            signal.addEventListener('abort', () => {
              cancelled = true
              reject(new DOMException('Aborted', 'AbortError'))
            })
          }),
      }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  unmount()
  expect(cancelled).toBe(true)
  expect(
    shouldRetryQuery(0, new ApiError('Unauthorized', { status: 401 })),
  ).toBe(false)
  expect(
    shouldRetryQuery(0, new ApiError('Temporary failure', { status: 503 })),
  ).toBe(true)
  expect(shouldRetryQuery(1, new Error('Network'))).toBe(false)
  client.clear()
})

it('preserves saved content offline and fetches once connectivity returns', async () => {
  const client = createAppQueryClient()
  onlineManager.setOnline(false)
  client.setQueryData(['offline'], 'Saved content', {
    updatedAt: Date.now() - 60_000,
  })
  const request = vi.fn(async () => 'Fresh content')
  const { result } = renderHook(
    () => useQuery({ queryKey: ['offline'], queryFn: request }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  expect(result.current.data).toBe('Saved content')
  expect(request).not.toHaveBeenCalled()
  act(() => onlineManager.setOnline(true))
  await waitFor(() => expect(result.current.data).toBe('Fresh content'))
  expect(request).toHaveBeenCalledTimes(1)
  client.clear()
})
