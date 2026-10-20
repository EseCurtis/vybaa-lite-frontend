/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { journalAPI } from '@/shared/api/journal.api'
import type {
  CreateJournalRequest,
  UpdateJournalRequest,
} from '@/shared/types/auth.types'
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export const journalKeys = {
  all: ['journals'] as const,
  lists: () => [...journalKeys.all, 'list'] as const,
  list: (filters: string) => [...journalKeys.lists(), { filters }] as const,
  details: () => [...journalKeys.all, 'detail'] as const,
  detail: (id: string) => [...journalKeys.details(), id] as const,
  byDate: (date: string) => [...journalKeys.all, 'date', date] as const,
  today: () => [...journalKeys.all, 'today'] as const,
  summary: () => [...journalKeys.all, 'summary'] as const,
  stats: () => [...journalKeys.all, 'stats'] as const,
  paginated: (page: number, limit: number) =>
    [...journalKeys.all, 'paginated', { page, limit }] as const,
  infinite: (limit?: number) =>
    limit === undefined
      ? ([...journalKeys.all, 'infinite'] as const)
      : ([...journalKeys.all, 'infinite', { limit }] as const),
}

export const useJournals = () => {
  return useQuery({
    queryKey: journalKeys.lists(),
    queryFn: ({ signal }) => journalAPI.getJournals(1, 20, signal),
    staleTime: 5 * 60 * 1000,
  })
}

export const useJournalsInfinite = (limit = 10) => {
  return useInfiniteQuery({
    queryKey: journalKeys.infinite(limit),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      journalAPI.getJournalsPage(pageParam, limit, signal),
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.page + 1
        : undefined
    },
    staleTime: 60 * 1000,
    refetchOnMount: true,
  })
}

export const useCreateJournal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateJournalRequest) => journalAPI.createJournal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: journalKeys.infinite() })
    },
  })
}

export const useUpdateJournal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      journalId,
      data,
    }: {
      journalId: string
      data: UpdateJournalRequest
    }) => journalAPI.updateJournal(journalId, data),
    onSuccess: (_, { journalId }) => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: journalKeys.infinite() })
      queryClient.invalidateQueries({ queryKey: journalKeys.detail(journalId) })
    },
  })
}

export const useDeleteJournal = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (journalId: string) => journalAPI.deleteJournal(journalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalKeys.lists() })
      queryClient.invalidateQueries({ queryKey: journalKeys.infinite() })
    },
  })
}

export const useJournal = (journalId?: string) => {
  return useQuery({
    queryKey: journalKeys.detail(journalId!),
    queryFn: journalId ? () => journalAPI.getJournalById(journalId) : undefined,
    enabled: !!journalId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useJournalByDate = (date?: string) => {
  return useQuery({
    queryKey: journalKeys.byDate(date!),
    queryFn: date ? () => journalAPI.getJournalByDate(date) : undefined,
    enabled: !!date,
    staleTime: 2 * 60 * 1000,
  })
}

export const useTodayJournal = () => {
  return useQuery({
    queryKey: journalKeys.today(),
    queryFn: () => journalAPI.getTodayEntry(),
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

export const useJournalSummary = () => {
  return useQuery({
    queryKey: journalKeys.summary(),
    queryFn: async () => {
      const response = await journalAPI.getJournalSummary()
      return response.data
    },
    staleTime: 1000 * 60 * 60, // 1 hour (summary is cached for 24h on backend)
  })
}

export const useJournalStats = () => {
  return useQuery({
    queryKey: journalKeys.stats(),
    queryFn: async () => {
      const response = await journalAPI.getJournalStats()
      return response.data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const usePaginatedJournals = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: journalKeys.paginated(page, limit),
    queryFn: ({ signal }) => journalAPI.getJournals(page, limit, signal),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  })
}
