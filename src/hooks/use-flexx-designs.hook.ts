import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { flexxAPI } from '@/shared/api/flexx.api'
import {
  compositionKey,
  starterFlexxDesigns,
} from '@/shared/flexx/flexx-design'
import type { FlexxCategory } from '@/shared/flexx/flexx-design'

export function useFlexxDesigns(
  userId: string | undefined,
  category: FlexxCategory,
  seed: number,
) {
  const query = useInfiniteQuery({
    queryKey: ['flexx', 'designs', 'scheduled-v3', userId, category],
    queryFn: ({ pageParam, signal }) =>
      flexxAPI.designs(category, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: Boolean(userId),
    staleTime: 6 * 60 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  const designs = useMemo(() => {
    const seen = new Set<string>()
    const starters = starterFlexxDesigns(category, seed)
    const all = [
      ...starters,
      ...(query.data?.pages.flatMap((page) => page.designs) ?? []),
    ]
    return all.filter((design) => {
      const signature = compositionKey(design)
      if (seen.has(signature)) return false
      seen.add(signature)
      return true
    })
  }, [category, query.data?.pages, seed])
  return { ...query, designs }
}
