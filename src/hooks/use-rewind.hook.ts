import { useInfiniteQuery } from '@tanstack/react-query'

import { rewindAPI } from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'

export function usePaginatedRewindSessions(
  page: number = 1,
  limit: number = 10,
) {
  return useInfiniteQuery({
    queryKey: rewindQueryKeys.paginatedSessions(page, limit),
    initialPageParam: page,
    queryFn: async ({ pageParam }) => {
      const currentPage =
        typeof pageParam === 'number' && pageParam > 0 ? pageParam : page
      const response = await rewindAPI.getPaginatedSessions(currentPage, limit)
      const { pagination, sessions } = response.data

      return {
        data: sessions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          totalCount: pagination.total,
          totalPages: pagination.totalPages,
          hasNextPage: pagination.hasMore,
          hasPrevPage: pagination.page > 1,
        },
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
