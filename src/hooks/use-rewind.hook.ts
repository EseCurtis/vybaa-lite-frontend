import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import type { RewindSessionsFilters } from '@/shared/api/rewind.api'
import { rewindAPI } from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'

export function usePaginatedRewindSessions(
  page: number = 1,
  limit: number = 10,
  filters?: RewindSessionsFilters,
) {
  return useInfiniteQuery({
    queryKey: rewindQueryKeys.paginatedSessions(page, limit, filters),
    initialPageParam: page,
    queryFn: async ({ pageParam }) => {
      const currentPage =
        typeof pageParam === 'number' && pageParam > 0 ? pageParam : page
      const response = await rewindAPI.getPaginatedSessions(
        currentPage,
        limit,
        filters,
      )
      const {
        filters: responseFilters,
        pagination,
        sessions,
        summary,
      } = response.data

      return {
        data: sessions,
        filters: responseFilters,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount: pagination.total,
          totalPages: pagination.totalPages,
          hasNextPage: pagination.hasMore,
          hasPrevPage: pagination.page > 1,
        },
        summary,
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.hasNextPage) {
        return undefined
      }

      return lastPage.pagination.page + 1
    },
    getPreviousPageParam: (firstPage) => {
      if (!firstPage.pagination.hasPrevPage) {
        return undefined
      }

      return firstPage.pagination.page - 1
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useRewindSession(sessionId: string) {
  return useQuery({
    enabled: Boolean(sessionId),
    queryFn: async () => {
      const response = await rewindAPI.getSession(sessionId)
      return response.data
    },
    queryKey: rewindQueryKeys.session(sessionId),
    staleTime: 1000 * 60 * 5,
  })
}
