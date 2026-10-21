import { useQuery } from '@tanstack/react-query'

import { goalQueryKeys } from '@/shared/api/goal.query-keys'
import { quickTaskSuggestionAPI } from '@/shared/api/quick-task-suggestion.api'

export function useQuickTaskSuggestions(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: [...goalQueryKeys.all, 'suggestions', userId],
    queryFn: ({ signal }) => quickTaskSuggestionAPI.list(signal),
    enabled: Boolean(userId) && enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  })
}
