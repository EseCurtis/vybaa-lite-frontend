import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { http } from '@/shared/api/http'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'

export type ConversationMood = {
  energy: number
  playfulness: number
  directness: number
}
export type RewindChatSettings = {
  id: string
  title: string
  type: 'GROUP' | 'PARTNER'
  personaId: string | null
  proactiveMuted: boolean
  conversationMood: ConversationMood
}
const settingsKey = (chatId: string) => [
  ...rewindQueryKeys.chats(),
  chatId,
  'settings',
]

export function useRewindChatSettings(chatId: string) {
  return useQuery({
    queryKey: settingsKey(chatId),
    queryFn: async (): Promise<RewindChatSettings> => {
      const response = await http.get<{ data: RewindChatSettings }>(
        `/api/v2/rewind/chats/${encodeURIComponent(chatId)}/preferences`,
      )
      return response.data.data
    },
    enabled: Boolean(chatId),
  })
}

export function useUpdateRewindChatSettings(chatId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Pick<RewindChatSettings, 'conversationMood' | 'proactiveMuted'>,
    ): Promise<void> => {
      await http.patch(
        `/api/v2/rewind/chats/${encodeURIComponent(chatId)}/preferences`,
        input,
      )
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: rewindQueryKeys.chats() }),
        client.invalidateQueries({
          queryKey: rewindQueryKeys.chatMessages(chatId),
        }),
      ])
    },
  })
}
