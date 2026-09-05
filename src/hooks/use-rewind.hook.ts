import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'

import type {
  EnqueueRewindChatMessageInput,
  RewindChatMessage,
  RewindChatReactionKind,
  RewindV2ChatMessagesResponse,
  RewindChatStreamEvent,
  RewindInsightsRange,
  RewindObservationsResponse,
  UpdateRewindRoutineInput,
  RewindSessionsFilters,
} from '@/shared/api/rewind.api'
import { rewindAPI } from '@/shared/api/rewind.api'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'

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
    refetchInterval: (query) =>
      query.state.data?.status === 'FINALIZING' ? 1_500 : false,
    staleTime: 1000 * 60 * 5,
  })
}

export function useRewindInsights(range: RewindInsightsRange) {
  return useQuery({
    queryKey: rewindQueryKeys.insights(range),
    queryFn: async () => {
      const response = await rewindAPI.getInsights(range)
      return response.data
    },
    staleTime: 1000 * 60,
  })
}

export function useRewindHomeGreeting(personaId?: RewindPersonaId | null) {
  return useQuery({
    queryFn: async () => {
      const response = await rewindAPI.getHomeGreeting()
      return response.data
    },
    queryKey: [...rewindQueryKeys.homeGreeting(), personaId ?? 'unselected'],
    staleTime: 1000 * 60 * 10,
  })
}

export function useRewindObservations(limit: number = 12) {
  return useInfiniteQuery<
    RewindObservationsResponse['data'],
    Error,
    InfiniteData<RewindObservationsResponse['data'], string>,
    ReturnType<typeof rewindQueryKeys.observations>,
    string
  >({
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: '',
    queryFn: async ({
      pageParam,
    }): Promise<RewindObservationsResponse['data']> => {
      const response = await rewindAPI.getObservations(
        pageParam || undefined,
        limit,
      )
      return response.data
    },
    queryKey: rewindQueryKeys.observations(),
    staleTime: 1000 * 60 * 5,
  })
}

export function useDismissRewindObservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (observationId: string) =>
      rewindAPI.dismissObservation(observationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.observations(),
        }),
        queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.homeGreeting(),
        }),
      ])
    },
  })
}

export function useRewindChats() {
  return useQuery({
    queryFn: async () => {
      const response = await rewindAPI.getV2Chats()
      return response.data.chats
    },
    queryKey: rewindQueryKeys.chats(),
    staleTime: 1000 * 30,
  })
}

export function useRewindChatMessages(chatId: string, limit: number = 30) {
  return useInfiniteQuery<
    RewindV2ChatMessagesResponse['data'],
    Error,
    InfiniteData<RewindV2ChatMessagesResponse['data'], string>,
    ReturnType<typeof rewindQueryKeys.chatMessages>,
    string
  >({
    enabled: Boolean(chatId),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: '',
    queryFn: async ({
      pageParam,
    }): Promise<RewindV2ChatMessagesResponse['data']> => {
      const response = await rewindAPI.getV2ChatMessages(
        chatId,
        pageParam || undefined,
        limit,
      )
      return response.data
    },
    queryKey: rewindQueryKeys.chatMessages(chatId),
    staleTime: 1000 * 15,
  })
}

export function useEnqueueRewindChatMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EnqueueRewindChatMessageInput) =>
      rewindAPI.enqueueV2ChatMessage(chatId, input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.chatMessages(chatId),
        }),
        queryClient.invalidateQueries({ queryKey: rewindQueryKeys.chats() }),
      ])
    },
  })
}

export function useMarkRewindChatRead(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (throughMessageId: string) =>
      rewindAPI.markV2ChatRead(chatId, throughMessageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rewindQueryKeys.chats(),
      })
    },
  })
}

export function useReactToRewindChatMessage(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      messageId: string
      reaction: RewindChatReactionKind | null
    }) =>
      rewindAPI.updateV2ChatReaction(chatId, input.messageId, input.reaction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: rewindQueryKeys.chatMessages(chatId),
      })
    },
  })
}

export function useMuteRewindChat(chatId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (proactiveMuted: boolean) =>
      rewindAPI.updateV2ChatPreferences(chatId, proactiveMuted),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: rewindQueryKeys.chats() }),
        queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.chatMessages(chatId),
        }),
      ])
    },
  })
}

export function useSendRewindChatMessage(chatId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { content: string; idempotencyKey: string }) =>
      rewindAPI.sendChatMessage(chatId, input),
    onSuccess: (response) => {
      const newMessages: RewindChatMessage[] = [
        response.data.userMessage,
        response.data.partnerMessage,
      ]
      queryClient.setQueryData(
        rewindQueryKeys.chatMessages(chatId),
        (current: unknown) =>
          appendMessagesToInfiniteQuery(current, newMessages),
      )
      void queryClient.invalidateQueries({ queryKey: rewindQueryKeys.chats() })
    },
  })
}

export function useStreamRewindChatMessage(chatId: string) {
  const queryClient = useQueryClient()

  return useMutation<
    void,
    Error,
    {
      content: string
      idempotencyKey: string
      onEvent: (event: RewindChatStreamEvent) => void
      signal?: AbortSignal
    }
  >({
    mutationFn: (input) =>
      rewindAPI.streamChatMessage(
        chatId,
        {
          content: input.content,
          idempotencyKey: input.idempotencyKey,
        },
        input.onEvent,
        input.signal,
      ),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: rewindQueryKeys.chatMessages(chatId),
        }),
        queryClient.invalidateQueries({ queryKey: rewindQueryKeys.chats() }),
      ])
    },
  })
}

function appendMessagesToInfiniteQuery(
  current: unknown,
  messages: RewindChatMessage[],
): unknown {
  if (!isInfiniteMessageData(current)) return current
  const firstPage = current.pages[0]
  if (!firstPage) return current
  const knownIds = new Set(firstPage.items.map((message) => message.id))
  const additions = messages.filter((message) => !knownIds.has(message.id))
  return {
    ...current,
    pages: [
      { ...firstPage, items: [...firstPage.items, ...additions] },
      ...current.pages.slice(1),
    ],
  }
}

type InfiniteMessageData = {
  pages: Array<{
    chat: unknown
    items: RewindChatMessage[]
    nextCursor: string | null
  }>
  pageParams: unknown[]
}

function isInfiniteMessageData(value: unknown): value is InfiniteMessageData {
  if (!value || typeof value !== 'object') return false
  return 'pages' in value && Array.isArray(value.pages)
}

export function useRewindRoutine() {
  return useQuery({
    queryKey: rewindQueryKeys.routine(),
    queryFn: async () => {
      const response = await rewindAPI.getRoutine()
      return response.data
    },
    staleTime: 1000 * 30,
  })
}

export function useUpdateRewindRoutine() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateRewindRoutineInput) => {
      const response = await rewindAPI.updateRoutine(input)
      return response.data
    },
    onSuccess: async (overview) => {
      queryClient.setQueryData(rewindQueryKeys.routine(), overview)
      await queryClient.invalidateQueries({
        queryKey: rewindQueryKeys.all,
      })
    },
  })
}
