import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'

import { useAuth } from '@/providers/auth.provider'
import {
  isReflectionDayKey,
  reflectionsAPI,
} from '@/shared/api/reflections.api'
import type {
  DailyReflection,
  ReflectionDaysPage,
} from '@/shared/api/reflections.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'

export function useReflectionDays() {
  const { user } = useAuth()
  return useInfiniteQuery({
    queryKey: rewindQueryKeys.reflections(user?.id),
    queryFn: ({ pageParam, signal }) => reflectionsAPI.days(pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    retry: 1,
  })
}

export function useDailyReflection(dayKey: string) {
  const { user } = useAuth()
  const client = useQueryClient()
  return useQuery<DailyReflection>({
    queryKey: rewindQueryKeys.dailyReflection(user?.id, dayKey),
    queryFn: ({ signal }) => reflectionsAPI.day(dayKey, signal),
    enabled: Boolean(user?.id) && isReflectionDayKey(dayKey),
    placeholderData: () =>
      client
        .getQueryData<InfiniteData<ReflectionDaysPage>>(
          rewindQueryKeys.reflections(user?.id),
        )
        ?.pages.flatMap((page) => page.days)
        .find((day) => day.dayKey === dayKey)?.reflection,
    staleTime: 0,
    refetchInterval: (query) => {
      const reflection = query.state.data
      if (reflection?.processing) return 2000
      if (reflection?.state === 'COLLECTING' && !reflection.analyzedAt)
        return 15_000
      return false
    },
    refetchIntervalInBackground: false,
  })
}
