import {
  RiAtLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiNotificationLine,
  RiNotificationOffLine,
  RiSendPlane2Fill,
  RiTimeLine,
} from '@remixicon/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from 'react'

import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useEnqueueRewindChatMessage,
  useMuteRewindChat,
  useRewindChatMessages,
  useRewindChats,
  useMarkRewindChatRead,
} from '@/hooks/use-rewind.hook'
import { useNotificationContext } from '@/providers/notification.provider'
import { useToast } from '@/providers/toast.provider'
import type { RewindChatMessage } from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'

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

function formatMessageDay(value: string): string {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const today = new Date()
  const todayKey = getLocalDateKey(today)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = getLocalDateKey(yesterday)
  if (value === todayKey) return 'Today'
  if (value === yesterdayKey) return 'Yesterday'
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  }).format(date)
}

function getMessageDeliveryStatus(
  message: RewindChatMessage,
  readRunIds: ReadonlySet<string>,
): 'READ' | 'SENT' | undefined {
  if (message.role !== 'USER') return undefined
  if (message.runId && readRunIds.has(message.runId)) return 'READ'
  return 'SENT'
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getReplyAuthor(message: RewindChatMessage): string {
  if (message.role === 'USER') return 'You'
  if (message.personaId) return getRewindPersona(message.personaId).name
  return 'Earlier'
}

function messagesBelongTogether(
  current: RewindChatMessage,
  adjacent: RewindChatMessage | undefined,
): boolean {
  if (!adjacent) return false
  if (current.role !== adjacent.role) return false
  if (current.personaId !== adjacent.personaId) return false
  const currentTime = new Date(current.createdAt).getTime()
  const adjacentTime = new Date(adjacent.createdAt).getTime()
  return Math.abs(currentTime - adjacentTime) < 5 * 60 * 1000
}

const MENTION_PATTERN = /(@(?:ella|lyra|jake|ariel)\b)/gi
const COMPOSER_MAX_HEIGHT = 128

type RewindAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext
}

let rewindMessageAudioContext: AudioContext | null = null

function playRewindMessageSound(): void {
  if (typeof window === 'undefined') return
  try {
    const AudioContextConstructor =
      window.AudioContext ?? (window as RewindAudioWindow).webkitAudioContext
    if (!AudioContextConstructor) return
    rewindMessageAudioContext ??= new AudioContextConstructor()
    const context = rewindMessageAudioContext
    if (context.state === 'suspended') void context.resume().catch(() => {})
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const now = context.currentTime
    oscillator.frequency.setValueAtTime(660, now)
    oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08)
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.19)
  } catch {
    // Audio is an enhancement; autoplay/device restrictions must not affect chat.
  }
}

function resizeComposerInput(input: HTMLTextAreaElement): void {
  input.style.height = 'auto'
  input.style.height = `${Math.min(input.scrollHeight, COMPOSER_MAX_HEIGHT)}px`
}

function MentionText({
  className,
  content,
  style,
}: {
  className: string
  content: string
  style?: CSSProperties
}): ReactElement {
  const segments = content.split(MENTION_PATTERN)
  return (
    <Text className={className} style={style}>
      {segments.map((segment, index) => {
        const isMention = /^@(ella|lyra|jake|ariel)$/i.test(segment)
        return isMention ? (
          <span className="font-black" key={`${segment}-${index}`}>
            {segment}
          </span>
        ) : (
          segment
        )
      })}
    </Text>
  )
}

function ChatMessageBubble({
  deliveryStatus,
  message,
  replyTo,
  showIdentity,
  showTime,
}: {
  deliveryStatus?: 'READ' | 'SENT'
  message: RewindChatMessage
  replyTo?: RewindChatMessage
  showIdentity: boolean
  showTime: boolean
}): ReactElement {
  const isUser = message.role === 'USER'
  const persona = message.personaId ? getRewindPersona(message.personaId) : null

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      data-message-id={message.id}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      layout
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <View className="max-w-[82%] flex-row items-end gap-2">
        {!isUser && persona && showIdentity ? (
          <img
            alt={`${persona.name} avatar`}
            className="size-7 shrink-0 rounded-full object-cover"
            src={persona.avatar}
          />
        ) : !isUser ? (
          <View className="w-7 shrink-0" />
        ) : null}
        <View className={`gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && persona && showIdentity ? (
            <Text
              className="px-1 font-bbh text-[11px] font-black"
              style={{ color: persona.color }}
            >
              {persona.name}
            </Text>
          ) : null}
          <View
            className={
              isUser
                ? 'gap-1 rounded-[18px] rounded-br-md bg-accent-700 px-4 py-2.5'
                : 'gap-1 rounded-[18px] rounded-bl-md bg-card-light px-4 py-2.5'
            }
          >
            {replyTo ? (
              <View className="rounded-xl bg-cardx px-3 py-2">
                <Text className="font-bbh text-[10px] font-black text-card-lighter-3">
                  {getReplyAuthor(replyTo)}
                </Text>
                <Text
                  className="font-bbh text-xs leading-4 text-card-lighter-2"
                  lines={1}
                >
                  {replyTo.content}
                </Text>
              </View>
            ) : null}
            <MentionText
              className="whitespace-pre-wrap font-bbh text-[15px] leading-6"
              content={message.content}
              style={{ color: colors.white }}
            />
          </View>
          {showTime || deliveryStatus ? (
            <View className="flex-row items-center gap-1 px-1">
              {showTime ? (
                <Text className="font-bbh text-[10px] text-card-lighter-3">
                  {formatMessageTime(message.createdAt)}
                </Text>
              ) : null}
              {deliveryStatus ? (
                <span
                  aria-label={deliveryStatus === 'READ' ? 'Read' : 'Sent'}
                  className="inline-flex text-card-lighter-3"
                  role="img"
                >
                  {deliveryStatus === 'READ' ? (
                    <RiCheckDoubleLine size={14} />
                  ) : (
                    <RiCheckLine size={14} />
                  )}
                </span>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </motion.div>
  )
}

type StreamingPartner = {
  personaId: RewindChatMessage['personaId']
  runId: string
  startedAt: number
  turnId: string
}

function StreamingPartnerBubble({
  stream,
}: {
  stream: StreamingPartner
}): ReactElement | null {
  if (!stream.personaId) return null
  const persona = getRewindPersona(stream.personaId)
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex w-full justify-start"
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      layout
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <View className="max-w-[86%] flex-row items-end gap-2">
        <img
          alt={`${persona.name} avatar`}
          className="size-7 shrink-0 rounded-full object-cover"
          src={persona.avatar}
        />
        <View className="items-start gap-1">
          <Text
            className="px-1 font-bbh text-[11px] font-black"
            style={{ color: persona.color }}
          >
            {persona.name}
          </Text>
          <View className="min-h-11 justify-center rounded-[18px] rounded-bl-md bg-card-light px-4 py-2.5">
            <View className="flex-row gap-1.5 py-1">
              {[0, 1, 2].map((index) => (
                <motion.div
                  animate={{ opacity: [0.35, 1, 0.35], y: [0, -3, 0] }}
                  className="size-1.5 rounded-full bg-card-lighter-3"
                  key={index}
                  transition={{
                    delay: index * 0.12,
                    duration: 0.8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    </motion.div>
  )
}

function MentionComposer({
  inputRef,
  onChange,
  placeholder,
  value,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  placeholder: string
  value: string
}): ReactElement {
  useLayoutEffect(() => {
    const input = inputRef.current
    if (input) resizeComposerInput(input)
  }, [inputRef, value])

  return (
    <View className="relative max-h-32 min-h-12 min-w-0 flex-1 overflow-hidden rounded-2xl bg-card-light">
      {value ? (
        <MentionText
          className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-4 py-3 font-bbh text-[16px] leading-normal text-card-lighter-1"
          content={value}
        />
      ) : null}
      <textarea
        aria-label="Message your Rewind partners"
        className={`relative max-h-32 min-h-12 w-full resize-none bg-transparent px-4 py-3 font-bbh text-[16px] leading-normal outline-none placeholder:text-card-lighter-3 ${
          value ? 'text-transparent caret-white' : 'text-white'
        }`}
        maxLength={4000}
        onChange={(event) => {
          resizeComposerInput(event.currentTarget)
          onChange(event.target.value)
        }}
        placeholder={placeholder}
        ref={inputRef}
        rows={1}
        value={value}
      />
    </View>
  )
}

function PendingMessage({ content }: { content: string }): ReactElement {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex w-full justify-end"
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      layout
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      <View className="max-w-[82%] items-end gap-1">
        <View className="rounded-[18px] rounded-br-md bg-accent-800 px-4 py-2.5">
          <Text className="whitespace-pre-wrap font-bbh text-[15px] leading-6 text-white">
            {content}
          </Text>
        </View>
        <View className="flex-row items-center gap-1 px-1 text-card-lighter-3">
          <Text className="font-bbh text-[10px] text-card-lighter-3">
            Sending
          </Text>
          <span aria-label="Sending" className="inline-flex" role="img">
            <RiTimeLine size={13} />
          </span>
        </View>
      </View>
    </motion.div>
  )
}

export default function RewindChatScreen({
  chatId,
}: {
  chatId: string
}): ReactElement {
  const [composerValue, setComposerValue] = useState('')
  const [mentionsOpen, setMentionsOpen] = useState(false)
  const [pendingMessages, setPendingMessages] = useState<
    Array<{ content: string; id: string }>
  >([])
  const [streamMessages, setStreamMessages] = useState<RewindChatMessage[]>([])
  const [streamingPartners, setStreamingPartners] = useState<
    StreamingPartner[]
  >([])
  const [seenRunIds, setSeenRunIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const shouldStickToBottomRef = useRef(true)
  const olderScrollHeightRef = useRef<number | null>(null)
  const lastMarkedReadRef = useRef<string | null>(null)
  const brokenDeltaTurnsRef = useRef<Set<string>>(new Set())
  const lastDeltaSequenceRef = useRef<Map<string, number>>(new Map())
  const inactiveRunIdsRef = useRef<Set<string>>(new Set())
  const playedSoundMessageIdsRef = useRef<Set<string>>(new Set())
  const toast = useToast()
  const messagesQuery = useRewindChatMessages(chatId)
  const chatsQuery = useRewindChats()
  const sendMutation = useEnqueueRewindChatMessage(chatId)
  const markReadMutation = useMarkRewindChatRead(chatId)
  const muteMutation = useMuteRewindChat(chatId)
  const { isConnected, subscribeRewindChat } = useNotificationContext()
  const chat = chatsQuery.data?.find((item) => item.id === chatId)
  const firstPage = messagesQuery.data?.pages[0]
  const messages: RewindChatMessage[] = []
  const pages = messagesQuery.data?.pages ?? []
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]
    if (page) messages.push(...page.items)
  }
  const knownMessageIds = new Set(messages.map((message) => message.id))
  const visibleStreamMessages = streamMessages.filter(
    (message) => !knownMessageIds.has(message.id),
  )

  useEffect(() => {
    return subscribeRewindChat((event) => {
      if (event.chatId !== chatId) return
      if (event.type === 'run_state') {
        if (event.status === 'CANCELLED') {
          inactiveRunIdsRef.current.add(event.runId)
          setStreamingPartners((current) => {
            current
              .filter((stream) => stream.runId === event.runId)
              .forEach((stream) => {
                brokenDeltaTurnsRef.current.delete(stream.turnId)
                lastDeltaSequenceRef.current.delete(stream.turnId)
              })
            return current.filter((stream) => stream.runId !== event.runId)
          })
          return
        }
        if (event.status !== 'GENERATING') return
        if (inactiveRunIdsRef.current.has(event.runId)) return
        setSeenRunIds((current) => {
          if (current.has(event.runId)) return current
          return new Set([...current, event.runId])
        })
        return
      }
      if (event.type === 'typing_started') {
        if (inactiveRunIdsRef.current.has(event.runId)) return
        if (!lastDeltaSequenceRef.current.has(event.turnId)) {
          brokenDeltaTurnsRef.current.delete(event.turnId)
          lastDeltaSequenceRef.current.set(event.turnId, 0)
        }
        setStreamingPartners((current) => {
          if (current.some((stream) => stream.turnId === event.turnId))
            return current
          return [
            ...current,
            {
              personaId: event.personaId,
              runId: event.runId,
              startedAt: Date.now(),
              turnId: event.turnId,
            },
          ].sort((left, right) => left.startedAt - right.startedAt)
        })
        return
      }
      if (event.type === 'typing_stopped') {
        brokenDeltaTurnsRef.current.delete(event.turnId)
        lastDeltaSequenceRef.current.delete(event.turnId)
        setStreamingPartners((current) =>
          current.filter((stream) => stream.turnId !== event.turnId),
        )
        return
      }
      if (event.type === 'message_delta') {
        if (inactiveRunIdsRef.current.has(event.runId)) return
        if (brokenDeltaTurnsRef.current.has(event.turnId)) return
        const lastSequence = lastDeltaSequenceRef.current.get(event.turnId) ?? 0
        if (event.sequence <= lastSequence) return
        if (event.sequence !== lastSequence + 1) {
          brokenDeltaTurnsRef.current.add(event.turnId)
          setStreamingPartners((current) =>
            current.filter((stream) => stream.turnId !== event.turnId),
          )
          return
        }
        lastDeltaSequenceRef.current.set(event.turnId, event.sequence)
        // Deltas are intentionally not rendered: the completed, validated
        // message appears as one bubble instead of a typewriter effect.
        return
      }
      if (event.type === 'run_failed') {
        inactiveRunIdsRef.current.add(event.runId)
        setStreamingPartners((current) => {
          current
            .filter((stream) => stream.runId === event.runId)
            .forEach((stream) => {
              brokenDeltaTurnsRef.current.delete(stream.turnId)
              lastDeltaSequenceRef.current.delete(stream.turnId)
            })
          return current.filter((stream) => stream.runId !== event.runId)
        })
        return
      }
      if (event.type === 'message_committed') {
        brokenDeltaTurnsRef.current.delete(event.turnId)
        lastDeltaSequenceRef.current.delete(event.turnId)
        setStreamMessages((current) => {
          const withoutCommitted = current.filter(
            (message) => message.id !== event.message.id,
          )
          return [...withoutCommitted, event.message]
        })
        setStreamingPartners((current) =>
          current.filter((stream) => stream.turnId !== event.turnId),
        )
        if (!playedSoundMessageIdsRef.current.has(event.messageId)) {
          playedSoundMessageIdsRef.current.add(event.messageId)
          playRewindMessageSound()
        }
        markReadMutation.mutate(event.messageId)
        void messagesQuery.refetch()
        void chatsQuery.refetch()
        return
      }
      if (event.type === 'chat_invalidated') {
        void messagesQuery.refetch()
        void chatsQuery.refetch()
      }
    })
  }, [chatId, subscribeRewindChat])

  useEffect(() => {
    if (!isConnected) return
    void messagesQuery.refetch()
    void chatsQuery.refetch()
  }, [isConnected])

  const latestMessage = messages[messages.length - 1]
  const latestMessageId =
    latestMessage?.role === 'PARTNER' ? latestMessage.id : null

  useEffect(() => {
    if (!latestMessageId || latestMessageId === lastMarkedReadRef.current)
      return
    lastMarkedReadRef.current = latestMessageId
    markReadMutation.mutate(latestMessageId)
  }, [latestMessageId, markReadMutation])

  const activeTurns = firstPage?.activeTurns ?? []
  const activeGeneratingTurns = activeTurns.filter(
    (turn) => turn.status === 'GENERATING',
  )
  const activeTurnKey = activeGeneratingTurns.map((turn) => turn.id).join(',')
  useEffect(() => {
    if (!activeGeneratingTurns.length) return
    setStreamingPartners((current) => {
      const known = new Set(current.map((stream) => stream.turnId))
      const recovered = activeGeneratingTurns
        .filter(
          (turn) =>
            !known.has(turn.id) && !inactiveRunIdsRef.current.has(turn.runId),
        )
        .map((turn) => ({
          personaId: turn.personaId,
          runId: turn.runId,
          startedAt: Date.now(),
          turnId: turn.id,
        }))
      return recovered.length ? [...current, ...recovered] : current
    })
  }, [activeTurnKey])

  const readRunIds = new Set<string>(seenRunIds)
  for (const message of [...messages, ...visibleStreamMessages]) {
    if (message.role === 'PARTNER' && message.runId) {
      readRunIds.add(message.runId)
    }
  }
  for (const stream of streamingPartners) readRunIds.add(stream.runId)
  for (const turn of activeTurns) {
    if (
      !inactiveRunIdsRef.current.has(turn.runId) &&
      (turn.status === 'GENERATING' || turn.status === 'PLANNED')
    ) {
      readRunIds.add(turn.runId)
    }
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
    if (shouldStickToBottomRef.current) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages.length, pendingMessages, streamMessages, streamingPartners])

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
    if (!content) return
    const idempotencyKey = createMessageKey()
    shouldStickToBottomRef.current = true
    setComposerValue('')
    setMentionsOpen(false)
    composerInputRef.current?.focus({ preventScroll: true })
    setPendingMessages((current) => [
      ...current,
      { content, id: idempotencyKey },
    ])
    void sendMutation
      .mutateAsync({ content, idempotencyKey })
      .then((response) => {
        setPendingMessages((current) =>
          current.filter((pending) => pending.id !== idempotencyKey),
        )
        const userMessage = {
          ...response.data.userMessage,
          runId: response.data.runId,
        }
        setStreamMessages((current) =>
          current.some((message) => message.id === userMessage.id)
            ? current
            : [...current, userMessage],
        )
      })
      .catch((error: unknown) => {
        setPendingMessages((current) =>
          current.filter((pending) => pending.id !== idempotencyKey),
        )
        setComposerValue((current) => current || content)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Your message could not be sent',
        )
      })
  }

  const toggleMention = (personaName: string): void => {
    const personaId = personaName.toLowerCase()
    const mentionPattern = new RegExp(`@${personaId}\\b\\s*`, 'i')
    setComposerValue((current) => {
      if (mentionPattern.test(current)) {
        return current.replace(mentionPattern, '').replace(/\s{2,}/g, ' ')
      }
      const separator = current && !current.endsWith(' ') ? ' ' : ''
      return `${current}${separator}@${personaId} `
    })
  }

  return (
    <View className="flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <View className="flex h-full min-h-0 flex-col">
          <TabHeader
            canGoBack
            children={
              <Pressable
                accessibilityLabel={
                  chat?.proactiveMuted
                    ? 'Unmute partner messages'
                    : 'Mute partner messages'
                }
                className="size-10 items-center justify-center rounded-full bg-card-light"
                disabled={muteMutation.isPending || !chat}
                onPress={() => {
                  if (chat) muteMutation.mutate(!chat.proactiveMuted)
                }}
              >
                {chat?.proactiveMuted ? (
                  <RiNotificationOffLine
                    size={18}
                    className="text-card-lighter-1"
                  />
                ) : (
                  <RiNotificationLine
                    size={18}
                    className="text-card-lighter-1"
                  />
                )}
              </Pressable>
            }
            title={
              chat ? (
                <View className="flex-row items-center gap-2">
                  <RewindChatAvatar chat={chat} className="size-8" />
                  <View className="items-start">
                    <Text className="font-bbh text-base font-bold leading-5 text-white">
                      {chat.title}
                    </Text>
                    <Text className="font-bbh text-[10px] font-bold text-card-lighter-3">
                      {isConnected ? 'Here with you' : 'Reconnecting…'}
                    </Text>
                  </View>
                </View>
              ) : (
                'Rewind chat'
              )
            }
          />

          <div
            className="min-h-0 flex-1 overflow-y-auto px-mg"
            onScroll={(event) => {
              const container = event.currentTarget
              const distanceFromBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight
              shouldStickToBottomRef.current = distanceFromBottom < 80
            }}
            ref={scrollContainerRef}
          >
            <View className="mx-auto min-h-full w-full max-w-3xl justify-end gap-1 py-4">
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
                messages.map((message, index) => {
                  const previous = messages[index - 1]
                  const next = messages[index + 1]
                  const showDay =
                    previous?.localDateKey !== message.localDateKey
                  const showIdentity = !messagesBelongTogether(
                    message,
                    previous,
                  )
                  const showTime = !messagesBelongTogether(message, next)
                  return (
                    <Fragment key={message.id}>
                      {showDay ? (
                        <Text className="self-center px-3 py-4 font-bbh text-[11px] font-bold text-card-lighter-3">
                          {formatMessageDay(message.localDateKey)}
                        </Text>
                      ) : null}
                      <View className={showIdentity && index ? 'mt-3' : ''}>
                        <ChatMessageBubble
                          deliveryStatus={getMessageDeliveryStatus(
                            message,
                            readRunIds,
                          )}
                          message={message}
                          replyTo={
                            message.replyToMessageId
                              ? messages.find(
                                  (candidate) =>
                                    candidate.id === message.replyToMessageId,
                                )
                              : undefined
                          }
                          showIdentity={showIdentity}
                          showTime={showTime}
                        />
                      </View>
                    </Fragment>
                  )
                })
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
              <AnimatePresence initial={false}>
                {pendingMessages.map((pending) => (
                  <PendingMessage content={pending.content} key={pending.id} />
                ))}
                {visibleStreamMessages.map((message) => (
                  <ChatMessageBubble
                    deliveryStatus={getMessageDeliveryStatus(
                      message,
                      readRunIds,
                    )}
                    key={message.id}
                    message={message}
                    replyTo={
                      message.replyToMessageId
                        ? messages.find(
                            (candidate) =>
                              candidate.id === message.replyToMessageId,
                          )
                        : undefined
                    }
                    showIdentity
                    showTime
                  />
                ))}
                {streamingPartners.map((stream) => (
                  <StreamingPartnerBubble key={stream.turnId} stream={stream} />
                ))}
              </AnimatePresence>
            </View>
          </div>

          <View className="shrink-0 gap-2 bg-cardx px-mg pb-[calc(var(--safe-area-inset-bottom,0px)+12px)] pt-3">
            <AnimatePresence initial={false}>
              {chat?.type === 'GROUP' && mentionsOpen ? (
                <motion.div
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  className="overflow-hidden"
                  exit={{ height: 0, opacity: 0, y: 6 }}
                  initial={{ height: 0, opacity: 0, y: 6 }}
                >
                  <View className="no-scrollbar flex-row gap-2 overflow-x-auto">
                    {REWIND_PERSONAS.map((persona) => {
                      const isMentioned = new RegExp(
                        `@${persona.id}\\b`,
                        'i',
                      ).test(composerValue)
                      return (
                        <Pressable
                          accessibilityLabel={`Mention ${persona.name}`}
                          aria-pressed={isMentioned}
                          className={`min-h-9 shrink-0 flex-row items-center gap-1.5 rounded-full px-3 ${
                            isMentioned ? 'bg-white' : 'bg-card-light'
                          }`}
                          key={persona.id}
                          onPress={() => toggleMention(persona.name)}
                        >
                          <img
                            alt=""
                            className="size-5 rounded-full object-cover"
                            src={persona.avatar}
                          />
                          <Text
                            className={`font-bbh text-xs font-black ${
                              isMentioned ? 'text-cardd' : 'text-card-lighter-2'
                            }`}
                          >
                            @{persona.name}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <View className="flex-row items-end gap-2">
              {chat?.type === 'GROUP' ? (
                <Pressable
                  accessibilityLabel="Mention a Rewind partner"
                  aria-expanded={mentionsOpen}
                  className={`size-12 shrink-0 items-center justify-center rounded-full ${
                    mentionsOpen ? 'bg-white' : 'bg-card-light'
                  }`}
                  onPress={() => setMentionsOpen((current) => !current)}
                >
                  <RiAtLine
                    className={
                      mentionsOpen ? 'text-cardd' : 'text-card-lighter-2'
                    }
                    size={19}
                  />
                </Pressable>
              ) : null}
              <MentionComposer
                inputRef={composerInputRef}
                onChange={setComposerValue}
                placeholder={
                  chat?.type === 'GROUP'
                    ? 'Message the group…'
                    : `Message ${chat?.title ?? 'your partner'}…`
                }
                value={composerValue}
              />
              <Pressable
                accessibilityLabel="Send message"
                className="size-12 shrink-0 items-center justify-center rounded-full bg-white"
                disabled={!composerValue.trim()}
                onPressIn={() => {
                  composerInputRef.current?.focus({ preventScroll: true })
                }}
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
