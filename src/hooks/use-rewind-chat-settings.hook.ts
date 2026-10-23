import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { http } from '@/shared/api/http'
import { rewindQueryKeys } from '@/shared/api/rewind.query-keys'
import {
  DEFAULT_REWIND_CHAT_ACCENT,
  isRewindChatAccentId,
} from '@/shared/rewind/rewind-chat-accent'
import type { RewindChatAccentId } from '@/shared/rewind/rewind-chat-accent'

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
  accentColor: RewindChatAccentId
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
      const response = await http.get<{
        data: Omit<RewindChatSettings, 'accentColor'> & {
          accentColor?: unknown
        }
      }>(`/api/v2/rewind/chats/${encodeURIComponent(chatId)}/preferences`)
      const settings = response.data.data
      return {
        ...settings,
        accentColor: isRewindChatAccentId(settings.accentColor)
          ? settings.accentColor
          : DEFAULT_REWIND_CHAT_ACCENT,
      }
    },
    enabled: Boolean(chatId),
  })
}

export function useUpdateRewindChatSettings(chatId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: Pick<RewindChatSettings, 'accentColor' | 'conversationMood'>,
    ): Promise<void> => {
      await http.patch(
        `/api/v2/rewind/chats/${encodeURIComponent(chatId)}/preferences`,
        input,
      )
    },
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: rewindQueryKeys.chats() }),
        client.invalidateQueries({ queryKey: settingsKey(chatId) }),
        client.invalidateQueries({
          queryKey: rewindQueryKeys.chatMessages(chatId),
        }),
      ])
    },
  })
}
