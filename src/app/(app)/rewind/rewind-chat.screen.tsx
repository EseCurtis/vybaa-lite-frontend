import { RiSendPlane2Fill } from '@remixicon/react'
import type { KeyboardEvent, ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useRewindChatMessages,
  useSendRewindChatMessage,
} from '@/hooks/use-rewind.hook'
import { useToast } from '@/providers/toast.provider'
import type { RewindChatMessage } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'
import { contrastingTextColor } from '@/shared/utils/helpers.util'

import { RewindChatAvatar } from './rewind-chat-avatar.component'

function createMessageKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `rewind-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function formatMessageTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function ChatMessageBubble({
  message,
}: {
  message: RewindChatMessage
}): ReactElement {
  const isUser = message.role === 'USER'
  const persona = message.personaId ? getRewindPersona(message.personaId) : null
  const bubbleColor = persona?.color ?? colors['card-light']
  const partnerTextColor = contrastingTextColor(bubbleColor)

  return (
    <View
      className={isUser ? 'items-end' : 'items-start'}
      data-message-id={message.id}
    >
      <View className="max-w-[86%] flex-row items-end gap-2">
        {!isUser && persona ? (
          <img
            alt={`${persona.name} avatar`}
            className="size-7 shrink-0 rounded-full object-cover"
            src={persona.avatar}
          />
        ) : null}
        <View
          className={
            isUser
              ? 'gap-1 rounded-2xl rounded-br-md bg-accent-700 px-4 py-3'
              : 'gap-1 rounded-2xl rounded-bl-md px-4 py-3'
          }
          style={isUser ? undefined : { backgroundColor: bubbleColor }}
        >
          {!isUser && persona ? (
            <Text
              className="font-bbh text-[11px] font-bold"
              style={{ color: partnerTextColor }}
            >
              {persona.name}
            </Text>
          ) : null}
          <Text
            className="whitespace-pre-wrap font-bbh text-sm leading-6"
            style={{ color: isUser ? colors.white : partnerTextColor }}
          >
            {message.content}
          </Text>
          <Text
            className="self-end font-bbh text-[10px]"
            style={{
              color: isUser ? colors['card-lighter-3'] : partnerTextColor,
            }}
          >
            {formatMessageTime(message.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  )
}

function PendingMessage({ content }: { content: string }): ReactElement {
  return (
    <View className="items-end">
      <View className="max-w-[86%] gap-1 rounded-2xl rounded-br-md bg-accent-800 px-4 py-3">
        <Text className="whitespace-pre-wrap font-bbh text-sm leading-6 text-white">
          {content}
        </Text>
        <Text className="self-end font-bbh text-[10px] text-card-lighter-3">
          Sending…
        </Text>
      </View>
    </View>
  )
}

export default function RewindChatScreen({
  chatId,
}: {
  chatId: string
}): ReactElement {
  const [composerValue, setComposerValue] = useState('')
  const [pendingContent, setPendingContent] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const olderScrollHeightRef = useRef<number | null>(null)
  const toast = useToast()
  const messagesQuery = useRewindChatMessages(chatId)
  const sendMutation = useSendRewindChatMessage(chatId)
  const firstPage = messagesQuery.data?.pages[0]
  const chat = firstPage?.chat
  const messages: RewindChatMessage[] = []
  const pages = messagesQuery.data?.pages ?? []
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]
    if (page) messages.push(...page.items)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    if (olderScrollHeightRef.current !== null) {
      container.scrollTop +=
        container.scrollHeight - olderScrollHeightRef.current
      olderScrollHeightRef.current = null
      return
    }
    container.scrollTop = container.scrollHeight
  }, [messages.length, pendingContent])

  const loadOlderMessages = async (): Promise<void> => {
    const container = scrollContainerRef.current
    if (!container || messagesQuery.isFetchingNextPage) return
    olderScrollHeightRef.current = container.scrollHeight
    try {
      await messagesQuery.fetchNextPage()
    } catch (error: unknown) {
      olderScrollHeightRef.current = null
      toast.error(
        error instanceof Error
          ? error.message
          : 'Earlier messages could not load',
      )
    }
  }

  const sendMessage = (): void => {
    const content = composerValue.trim()
    if (!content || sendMutation.isPending) return
    setComposerValue('')
    setPendingContent(content)
    sendMutation.mutate(
      { content, idempotencyKey: createMessageKey() },
      {
        onError: (error) => {
          setComposerValue((current) => current || content)
          setPendingContent(null)
          toast.error(error.message || 'Your message could not be sent')
        },
        onSuccess: () => setPendingContent(null),
      },
    )
  }

  const handleComposerKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key !== 'Enter' || event.shiftKey) return
    event.preventDefault()
    sendMessage()
  }

  const insertMention = (personaName: string): void => {
    const mention = `@${personaName.toLowerCase()} `
    setComposerValue((current) => `${current}${mention}`)
  }

  return (
    <View className="flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <View className="flex h-full min-h-0 flex-col">
          <TabHeader
            title={
              chat ? (
                <View className="flex-row items-center gap-2">
                  <RewindChatAvatar chat={chat} className="size-8" />
                  <Text className="font-bbh text-lg font-bold text-white">
                    {chat.title}
                  </Text>
                </View>
              ) : (
                'Rewind chat'
              )
            }
          />

          <div
            className="min-h-0 flex-1 overflow-y-auto px-mg"
            ref={scrollContainerRef}
          >
            <View className="mx-auto min-h-full w-full max-w-3xl justify-end gap-3 py-4">
              {messagesQuery.hasNextPage ? (
                <Pressable
                  accessibilityLabel="Load older chat messages"
                  className="mx-auto min-h-11 items-center justify-center rounded-full bg-card-light px-4"
                  disabled={messagesQuery.isFetchingNextPage}
                  onPress={() => {
                    void loadOlderMessages()
                  }}
                >
                  <Text className="font-bbh text-xs font-bold text-card-lighter-2">
                    {messagesQuery.isFetchingNextPage
                      ? 'Loading…'
                      : 'Earlier messages'}
                  </Text>
                </Pressable>
              ) : null}

              {messagesQuery.isLoading ? (
                <View className="gap-4 py-8">
                  <Skeleton className="h-16 w-3/4 self-start" rounded="xl" />
                  <Skeleton className="h-20 w-4/5 self-end" rounded="xl" />
                  <Skeleton className="h-24 w-5/6 self-start" rounded="xl" />
                </View>
              ) : messagesQuery.isError ? (
                <View className="items-center gap-4 py-14 text-center">
                  <Text className="font-bbh text-base font-bold text-white">
                    This conversation could not load
                  </Text>
                  <Pressable
                    accessibilityLabel="Retry loading this conversation"
                    className="min-h-11 items-center justify-center rounded-full bg-white px-5"
                    onPress={() => {
                      void messagesQuery.refetch()
                    }}
                  >
                    <Text className="font-bbh text-sm font-bold text-cardd">
                      Try again
                    </Text>
                  </Pressable>
                </View>
              ) : messages.length ? (
                messages.map((message) => (
                  <ChatMessageBubble key={message.id} message={message} />
                ))
              ) : (
                <View className="items-center gap-3 py-14 text-center">
                  {chat ? (
                    <RewindChatAvatar chat={chat} className="size-16" />
                  ) : null}
                  <Text className="font-bbh text-base font-bold text-white">
                    Say what is on your mind
                  </Text>
                  <Text className="max-w-xs !text-center font-bbh text-sm leading-6 text-card-lighter-2">
                    There is no timer and no required ending. Come back whenever
                    you want.
                  </Text>
                </View>
              )}
              {pendingContent ? (
                <PendingMessage content={pendingContent} />
              ) : null}
              {sendMutation.isPending ? (
                <View className="pl-10 font-bbh text-[11px]">
                  <View className="bg-cardx flex-row gap-1 mr-auto p-1 rounded-full ">
                    <View className="size-3 bg-card-light rounded-full animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    <View className="size-3 bg-card-light rounded-full animate-pulse" />
                    <View className="size-3 bg-card-light rounded-full animate-[pulse_3s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                  </View>
                </View>
              ) : null}
            </View>
          </div>

          <View className="shrink-0 gap-2 bg-cardx px-mg pb-[calc(var(--safe-area-inset-bottom,0px)+12px)] pt-3">
            {chat?.type === 'GROUP' ? (
              <View className="flex-row gap-2 overflow-x-auto no-scrollbar">
                {REWIND_PERSONAS.map((persona) => (
                  <Pressable
                    accessibilityLabel={`Mention ${persona.name}`}
                    className="min-h-9 shrink-0 flex-row items-center gap-1.5 rounded-full bg-card-light px-3"
                    key={persona.id}
                    onPress={() => insertMention(persona.name)}
                  >
                    <img
                      alt=""
                      className="size-5 rounded-full object-cover"
                      src={persona.avatar}
                    />
                    <Text className="font-bbh text-xs font-bold text-card-lighter-2">
                      @{persona.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            <View className="flex-row items-end gap-2">
              <textarea
                aria-label="Message your Rewind partners"
                className="max-h-32 min-h-12 min-w-0 flex-1 resize-none rounded-2xl bg-card-light px-4 py-3 font-bbh text-[16px] text-white outline-none placeholder:text-card-lighter-3"
                maxLength={4000}
                onChange={(event) => setComposerValue(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder={
                  chat?.type === 'GROUP'
                    ? 'Message the group…'
                    : `Message ${chat?.title ?? 'your partner'}…`
                }
                rows={1}
                value={composerValue}
              />
              <Pressable
                accessibilityLabel="Send message"
                className="size-12 shrink-0 items-center justify-center rounded-full bg-white"
                disabled={!composerValue.trim() || sendMutation.isPending}
                onPress={sendMessage}
              >
                <RiSendPlane2Fill size={20} className="text-cardd" />
              </Pressable>
            </View>
          </View>
        </View>
      </NoiseComponent>
    </View>
  )
}
