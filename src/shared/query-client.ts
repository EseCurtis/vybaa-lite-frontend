import { QueryClient } from '@tanstack/react-query'
import { isCancel } from 'axios'

import { ApiError } from '@/shared/api/http'

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  if (failureCount >= 1 || isCancel(error)) return false
  if (error instanceof Error && error.name === 'AbortError') return false
  if (
    error instanceof ApiError &&
    error.status &&
    error.status >= 400 &&
    error.status < 500
  )
    return false
  return true
}

export function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 15 * 60_000,
        retry: shouldRetryQuery,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
      },
      mutations: { retry: false },
    },
  })
}
