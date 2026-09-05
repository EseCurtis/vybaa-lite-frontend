import {
  RiChatSmile3Line,
  RiCheckDoubleLine,
  RiCheckLine,
  RiRefreshLine,
} from '@remixicon/react'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import moment from 'moment'
import type { ReactElement } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import { useRewindChats } from '@/hooks/use-rewind.hook'
import { useAuth } from '@/providers/auth.provider'
import { authAPI } from '@/shared/api/auth.api'
import type { RewindChat } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import { formatRewindChatTypingStatus } from '@/shared/rewind/rewind-chat-realtime.util'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

import { RewindChatAvatar } from './rewind-chat-avatar.component'

function getChatPreview(chat: RewindChat): string {
  if (!chat.lastMessage) {
    return chat.type === 'GROUP'
      ? 'Bring something to the group'
      : 'Start an anytime conversation'
  }
  if (chat.lastMessage.role === 'USER')
    return `You: ${chat.lastMessage.content}`
  if (chat.lastMessage.personaId && chat.type === 'GROUP') {
    const persona = getRewindPersona(chat.lastMessage.personaId)
    return `${persona.name}: ${chat.lastMessage.content}`
  }
  return chat.lastMessage.content
}

function getChatMessageDeliveryStatus(
  chat: RewindChat,
): 'DELIVERED' | 'READ' | 'SENT' | null {
  const message = chat.lastMessage
  if (!message || message.role !== 'USER') return null
  if (message.seenAt) return 'READ'
  if (message.deliveredAt) return 'DELIVERED'
  return 'SENT'
}

function ChatRow({ chat }: { chat: RewindChat }): ReactElement {
  const navigate = useNavigate()
  const typingStatus = formatRewindChatTypingStatus(chat.activeParticipants)
  const deliveryStatus = getChatMessageDeliveryStatus(chat)

  return (
    <Pressable
      accessibilityLabel={`Open ${chat.title} chat`}
      className="min-h-20 w-full flex-row items-center gap-4 border-b border-b-card-light-50 px-4 py-3 text-left"
      onPress={() => {
        void navigate({
          params: { chatId: chat.id },
          to: '/app/rewind-chat/$chatId',
        })
      }}
    >
      <RewindChatAvatar chat={chat} />
      <View className="min-w-0 flex-1 gap-0">
        <View className="flex-row items-center justify-between gap-2">
          <Text
            className="min-w-0 flex-1 font-bbh text-sm font-bold leading-light text-white"
            lines={1}
          >
            {chat.title}
          </Text>
          {chat.lastMessageAt && (
            <Text className="shrink-0 font-bbh leading-light text-[11px] text-card-lighter-3">
              {moment(chat.lastMessageAt).fromNow()}
            </Text>
          )}
          {chat.unreadCount ? (
            <View className="min-w-5 items-center justify-center rounded-full bg-accent-600 px-1.5 py-0.5">
              <Text className="font-bbh text-[10px] font-bold text-white">
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          ) : null}
        </View>
        {typingStatus ? (
          <Text
            aria-live="polite"
            className="font-bbh text-xs font-bold leading-5 text-success-green"
            lines={1}
            role="status"
          >
            {typingStatus}
          </Text>
        ) : (
          <View className="min-w-0 flex-1 flex-row items-center gap-1">
            <Text
              className="min-w-0 flex-1 font-bbh text-xs leading-5 text-card-lighter-2"
              lines={1}
            >
              {getChatPreview(chat)}
            </Text>
            {deliveryStatus ? (
              <span
                aria-label={
                  deliveryStatus === 'READ'
                    ? 'Read'
                    : deliveryStatus === 'DELIVERED'
                      ? 'Delivered'
                      : 'Sent'
                }
                className="inline-flex shrink-0 text-card-lighter-3"
                role="img"
                style={
                  deliveryStatus === 'READ' ? { color: '#53bdeb' } : undefined
                }
              >
                {deliveryStatus === 'SENT' ? (
                  <RiCheckLine size={14} />
                ) : (
                  <RiCheckDoubleLine size={14} />
                )}
              </span>
            ) : null}
          </View>
        )}
      </View>
    </Pressable>
  )
}

export default function RewindChatsScreen(): ReactElement {
  const chatsQuery = useRewindChats()
  const { refreshSession, user } = useAuth()
  const explanationMutation = useMutation({
    mutationFn: () =>
      authAPI.updateProfile({
        rewindProactiveChatExplainedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      void refreshSession()
    },
  })

  return (
    <View className="flex-1 bg-cardd">
      <NoiseComponent>
        <TabHeader title="Discussions" />
        <View className="flex-1 overflow-y-auto pb-[calc(var(--safe-area-inset-bottom,0px)+24px)]">
          <View className="mx-auto w-full max-w-3xl gap-6 ">
            <View className="gap-2 px-mg pt-2">
              <Text className="font-bbh hidden text-2xl font-bold text-white">
                Your partners are here
              </Text>
              <Text className="font-bbh text-sm leading-6 text-card-lighter-2">
                Drop a thought into the room. Any partner can respond.
              </Text>
            </View>

            {!user?.rewindProactiveChatExplainedAt ? (
              <View className="mx-mg gap-3 rounded-2xl bg-cardx px-4 py-4">
                <View className="gap-1">
                  <Text className="font-bbh text-sm font-bold text-white">
                    Your partners may check in first
                  </Text>
                  <Text className="font-bbh text-xs leading-5 text-card-lighter-2">
                    They only speak when there is something useful to add. Mute
                    any chat whenever you want.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Dismiss partner messaging explanation"
                  className="self-start rounded-full bg-white px-4 py-2"
                  disabled={explanationMutation.isPending}
                  onPress={() => {
                    explanationMutation.mutate()
                  }}
                >
                  <Text className="font-bbh text-xs font-bold text-cardd">
                    Got it
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {chatsQuery.isLoading ? (
              <View className="gap-3">
                {Array.from({ length: 5 }, (_, index) => (
                  <View
                    className="min-h-20 flex-row items-center gap-4 rounded-2xl bg-cardx px-4"
                    key={index}
                  >
                    <Skeleton className="size-12" rounded="full" />
                    <View className="min-w-0 flex-1 gap-2">
                      <Skeleton className="h-4 w-28" rounded="sm" />
                      <Skeleton className="h-3 w-4/5" rounded="sm" />
                    </View>
                  </View>
                ))}
              </View>
            ) : chatsQuery.isError ? (
              <View className="items-center gap-4 rounded-2xl bg-cardx px-6 py-12 text-center">
                <Text className="font-bbh text-base font-bold text-white">
                  Your chats could not load
                </Text>
                <Pressable
                  accessibilityLabel="Retry loading Rewind chats"
                  className="min-h-11 flex-row items-center gap-2 rounded-full bg-white px-4"
                  onPress={() => {
                    void chatsQuery.refetch()
                  }}
                >
                  <RiRefreshLine size={17} className="text-cardd" />
                  <Text className="font-bbh text-sm font-bold text-cardd">
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : chatsQuery.data?.length ? (
              <View className="gap-2 px-mg">
                {chatsQuery.data.map((chat) => (
                  <ChatRow chat={chat} key={chat.id} />
                ))}
              </View>
            ) : (
              <View className="items-center gap-3 rounded-2xl bg-cardx px-6 py-12 text-center">
                <View className="size-14 items-center justify-center rounded-full bg-card-light">
                  <RiChatSmile3Line
                    size={25}
                    style={{ color: colors['card-lighter-2'] }}
                  />
                </View>
                <Text className="font-bbh text-base font-bold text-white">
                  Your partners will meet you here
                </Text>
              </View>
            )}
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
