import {
  RiAtLine,
  RiCheckDoubleLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEmotionHappyLine,
  RiMore2Line,
  RiNotificationLine,
  RiNotificationOffLine,
  RiReplyLine,
  RiSendPlane2Fill,
} from '@remixicon/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
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

import { Input } from '@/components/common/input.component'
import { NoiseComponent } from '@/components/common/noise.component'
import { Skeleton } from '@/components/common/skeleton.component'
import { TabHeader } from '@/components/common/tab-header.component'
import { useKeyboard } from '@/components/layout/keyboard-avoiding-view.component'
import { Pressable } from '@/components/layout/pressables.component'
import { Text } from '@/components/layout/text.component'
import { View } from '@/components/layout/view.component'
import {
  useClearRewindChat,
  useDeleteRewindChatMessage,
  useEnqueueRewindChatMessage,
  useMarkRewindChatRead,
  useMuteRewindChat,
  useReactToRewindChatMessage,
  useRenameRewindChat,
  useRewindChatMessages,
  useRewindChats,
} from '@/hooks/use-rewind.hook'
import { useNotificationContext } from '@/providers/notification.provider'
import { useToast } from '@/providers/toast.provider'
import type {
  RewindChatMessage,
  RewindChatReaction,
  RewindChatReactionKind,
} from '@/shared/api/rewind.api'
import { colors } from '@/shared/colors.shared'
import {
  getRewindChatReactionActorLabel,
  getRewindChatReactionEmoji,
} from '@/shared/rewind/rewind-chat-reactions.util'
import {
  getRewindPersona,
  REWIND_PERSONAS,
} from '@/shared/rewind/rewind-personas'

import { cn } from '@/shared/utils/helpers.util'
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
  seenMessageIds: ReadonlySet<string>,
): MessageDeliveryStatus | undefined {
  if (message.role !== 'USER') return undefined
  if (message.seenAt || seenMessageIds.has(message.id)) return 'READ'
  return 'DELIVERED'
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

const MENTION_PATTERN = /(@(?:ella|lyra|jake|ariel|tobi|neeja)\b)/gi
const COMPOSER_MAX_HEIGHT = 128
const READ_RECEIPT_COLOR = '#53bdeb'
const REACTION_PICKER_HEIGHT = 52
const REACTION_PICKER_OFFSET = 8
const REACTION_PICKER_VIEWPORT_MARGIN = 16
const REACTION_PICKER_WIDTH = 208
const REACTION_OPTIONS: ReadonlyArray<{
  emoji: string
  kind: RewindChatReactionKind
  label: string
}> = [
  { emoji: '❤️', kind: 'LOVE', label: 'Love' },
  { emoji: '😂', kind: 'LAUGH', label: 'Laugh' },
  { emoji: '😭', kind: 'CRY', label: 'Cry' },
  { emoji: '👍', kind: 'LIKE', label: 'Like' },
]

type MessageDeliveryStatus = 'DELIVERED' | 'READ' | 'SENT'

type ReactionPickerState = {
  messageId: string
  placement: 'ABOVE' | 'BELOW'
  left: number
  top: number
}

function createReactionPickerState(
  message: RewindChatMessage,
  anchorRect: Pick<DOMRect, 'bottom' | 'left' | 'right' | 'top'>,
  viewportHeight: number,
  viewportWidth: number,
): ReactionPickerState {
  const preferredLeft =
    message.role === 'USER'
      ? anchorRect.right - REACTION_PICKER_WIDTH
      : anchorRect.left
  const maximumLeft = Math.max(
    REACTION_PICKER_VIEWPORT_MARGIN,
    viewportWidth - REACTION_PICKER_WIDTH - REACTION_PICKER_VIEWPORT_MARGIN,
  )
  const left = Math.min(
    Math.max(preferredLeft, REACTION_PICKER_VIEWPORT_MARGIN),
    maximumLeft,
  )
  const topAbove =
    anchorRect.top - REACTION_PICKER_HEIGHT - REACTION_PICKER_OFFSET
  const placement =
    topAbove >= REACTION_PICKER_VIEWPORT_MARGIN ? 'ABOVE' : 'BELOW'
  const preferredTop =
    placement === 'ABOVE'
      ? topAbove
      : anchorRect.bottom + REACTION_PICKER_OFFSET
  const maximumTop = Math.max(
    REACTION_PICKER_VIEWPORT_MARGIN,
    viewportHeight - REACTION_PICKER_HEIGHT - REACTION_PICKER_VIEWPORT_MARGIN,
  )

  return {
    messageId: message.id,
    placement,
    left,
    top: Math.min(preferredTop, maximumTop),
  }
}

type PendingMessageState = {
  content: string
  id: string
  replyTo: RewindChatMessage | null
}

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
    <Text className={cn(className, 'break-words')} style={style}>
      {segments.map((segment, index) => {
        const isMention = /^@(ella|lyra|jake|ariel|tobi|neeja)$/i.test(segment)
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
  isReactionOverlayOpen,
  isReactionPickerOpen,
  isGroup,
  message,
  onReply,
  onDelete,
  onShowReactions,
  onToggleReactionPicker,
  replyTo,
  showIdentity,
  showTime,
}: {
  deliveryStatus?: MessageDeliveryStatus
  isReactionOverlayOpen: boolean
  isReactionPickerOpen: boolean
  isGroup?: boolean
  message: RewindChatMessage
  onReply: (message: RewindChatMessage) => void
  onDelete: (message: RewindChatMessage) => void
  onShowReactions: (message: RewindChatMessage) => void
  onToggleReactionPicker: (
    message: RewindChatMessage,
    anchor: HTMLButtonElement | null,
  ) => void
  replyTo?: RewindChatMessage
  showIdentity: boolean
  showTime: boolean
}): ReactElement {
  const bubbleRef = useRef<HTMLButtonElement | null>(null)
  const isUser = message.role === 'USER'
  const persona = message.personaId ? getRewindPersona(message.personaId) : null
  const deliveryLabel = deliveryStatus
    ? deliveryStatus.charAt(0) + deliveryStatus.slice(1).toLowerCase()
    : ''
  const hasDoubleTick =
    deliveryStatus === 'DELIVERED' || deliveryStatus === 'READ'
  const reactions = message.reactions ?? []
  const reactionLabel = reactions
    .map(
      (reaction) =>
        `${getRewindChatReactionActorLabel(reaction)} reacted ${getRewindChatReactionEmoji(reaction.kind)}`,
    )
    .join(', ')

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className={`flex w-full ${isReactionOverlayOpen ? 'relative z-50' : ''} ${isUser ? 'justify-end' : 'justify-start'}  [&_*]:!break-words [&_*]:!text-wrap overflow-x-hidden`}
      data-message-id={message.id}
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      layout
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      <View className="max-w-[85%]  overflow-hidden flex-row items-end gap-2">
        {isGroup &&
          (!isUser && persona && showIdentity ? (
            <img
              alt={`${persona.name} avatar`}
              className="size-7 shrink-0 rounded-full object-cover"
              src={persona.avatar}
            />
          ) : !isUser ? (
            <View className="w-7 shrink-0" />
          ) : null)}
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
            className={`flex-row relative  min-w-[100px] items-center gap-1  ${isUser ? 'flex-row-reverse item-end' : ''}`}
          >
            <motion.button
              aria-label={`Reply to ${getReplyAuthor(message)}`}
              className={cn(
                'flex   appearance-none w-full  flex-col gap-1 rounded-[11px] px-1 py-1 text-left',
                isUser
                  ? ' rounded-br-md bg-accent-700'
                  : 'rounded-bl-md bg-card-light',
              )}
              onClick={() => onReply(message)}
              ref={bubbleRef}
              type="button"
            >
              {replyTo ? (
                <View className="rounded-lg bg-cardx px-3 py-2">
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
                className="whitespace-pre-wrap max-w-[70vw] font-bbh text-[15px] px-2 py-1 leading-6"
                content={message.content}
                style={{ color: colors.white }}
              />

              {showTime || deliveryStatus ? (
                <View
                  className={cn(
                    isUser && 'ml-auto',
                    'flex-row items-center gap-1 px-1',
                  )}
                >
                  {showTime ? (
                    <Text
                      className={cn(
                        isUser ? 'text-white/70' : 'text-card-lighter-3',
                        'font-bbh text-[10px] ',
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </Text>
                  ) : null}
                  {deliveryStatus ? (
                    <span
                      aria-label={deliveryLabel}
                      className="inline-flex text-card-lighter-3"
                      role="img"
                      style={
                        deliveryStatus === 'READ'
                          ? { color: READ_RECEIPT_COLOR }
                          : undefined
                      }
                    >
                      {hasDoubleTick ? (
                        <RiCheckDoubleLine size={14} />
                      ) : (
                        <RiCheckLine size={14} />
                      )}
                    </span>
                  ) : null}
                </View>
              ) : null}
            </motion.button>
          </View>

          <View className="flex-row items-center gap-1">
            <Pressable
              accessibilityLabel={`React to ${getReplyAuthor(message)}'s message`}
              aria-expanded={isReactionPickerOpen}
              className={`size-11  shrink-0 items-center justify-center rounded-full ${isReactionPickerOpen ? 'bg-white' : 'bg-cardx'} ${isUser ? 'left-0' : 'right-0'}`}
              onPress={() => onToggleReactionPicker(message, bubbleRef.current)}
            >
              <RiEmotionHappyLine
                className={
                  isReactionPickerOpen ? 'text-cardd' : 'text-card-lighter-3'
                }
                size={16}
              />
            </Pressable>

            <Pressable
              accessibilityLabel={`Delete ${getReplyAuthor(message)}'s message`}
              className="size-11 shrink-0 items-center justify-center rounded-full bg-cardx"
              onPress={() => onDelete(message)}
            >
              <RiDeleteBinLine className="text-card-lighter-3" size={16} />
            </Pressable>

            {reactions.length ? (
              <Pressable
                accessibilityLabel={`View reactions. ${reactionLabel}`}
                className={`flex h-11 min-w-11 flex-row items-center gap-1 rounded-full bg-card-light p-2 px-3 ${isUser ? 'self-end' : 'self-start'}`}
                onPress={() => onShowReactions(message)}
              >
                {REACTION_OPTIONS.map((option) => {
                  const count = reactions.filter(
                    (reaction) => reaction.kind === option.kind,
                  ).length
                  if (!count) return null
                  return (
                    <Text
                      className="font-bbh text-xs text-card-lighter-1"
                      key={option.kind}
                    >
                      {option.emoji}
                      {count > 1 ? ` ${count}` : ''}
                    </Text>
                  )
                })}
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </motion.div>
  )
}

function ReactionDetailsDialog({
  closeButtonRef,
  message,
  onClose,
  reduceMotion,
}: {
  closeButtonRef: RefObject<HTMLButtonElement | null>
  message: RewindChatMessage
  onClose: () => void
  reduceMotion: boolean
}): ReactElement {
  const reactions = message.reactions ?? []

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      aria-label={`Reactions to ${getReplyAuthor(message)}'s message`}
      aria-modal="true"
      className="fixed bottom-[calc(var(--safe-area-inset-bottom,0px)+24px)] left-4 right-4 z-50 mx-auto max-w-sm rounded-[26px] bg-card-light px-4 pb-4 pt-3 shadow-2xl"
      exit={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0.97,
        y: reduceMotion ? 0 : 8,
      }}
      initial={{
        opacity: 0,
        scale: reduceMotion ? 1 : 0.97,
        y: reduceMotion ? 0 : 8,
      }}
      role="dialog"
      transition={{ duration: reduceMotion ? 0 : 0.18, ease: 'easeOut' }}
    >
      <View className="mb-2 flex-row items-center justify-between gap-3">
        <View className="items-start">
          <Text className="font-bbh text-sm font-black text-white">
            Reactions
          </Text>
          <Text className="font-bbh text-[11px] text-card-lighter-3">
            {reactions.length === 1
              ? '1 person reacted'
              : `${reactions.length} people reacted`}
          </Text>
        </View>
        <Pressable
          accessibilityLabel="Close reaction details"
          className="size-11 items-center justify-center rounded-full bg-cardx"
          onPress={onClose}
          ref={closeButtonRef}
        >
          <RiCloseLine className="text-card-lighter-2" size={18} />
        </Pressable>
      </View>

      <View className="gap-1">
        {reactions.map((reaction) => {
          const persona = reaction.personaId
            ? getRewindPersona(reaction.personaId)
            : null
          const actorLabel = getRewindChatReactionActorLabel(reaction)
          return (
            <View
              className="min-h-12 flex-row items-center gap-3 rounded-2xl bg-cardx px-3 py-2"
              key={`${reaction.actor}-${reaction.personaId ?? 'user'}`}
            >
              {persona ? (
                <img
                  alt=""
                  className="size-8 rounded-full object-cover"
                  src={persona.avatar}
                />
              ) : (
                <View className="size-8 items-center justify-center rounded-full bg-card-light">
                  <Text className="font-bbh text-xs font-black text-white">
                    You
                  </Text>
                </View>
              )}
              <Text className="min-w-0 flex-1 font-bbh text-sm font-bold text-card-lighter-1">
                {actorLabel}
              </Text>
              <Text
                aria-label={`${actorLabel} reacted ${getRewindChatReactionEmoji(reaction.kind)}`}
                className="font-bbh text-xl text-white"
              >
                {getRewindChatReactionEmoji(reaction.kind)}
              </Text>
            </View>
          )
        })}
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

function PendingMessage({
  content,
  replyTo,
}: Pick<PendingMessageState, 'content' | 'replyTo'>): ReactElement {
  return (
    <motion.div
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="flex w-full justify-end"
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      layout
      transition={{ duration: 0.16, ease: 'easeOut' }}
    >
      <View className="max-w-[82%] items-end gap-1">
        <View className="gap-1 rounded-[18px] rounded-br-md bg-accent-800 px-4 py-2.5">
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
          <Text className="whitespace-pre-wrap font-bbh text-[15px] leading-6 text-white">
            {content}
          </Text>
        </View>
        <View className="flex-row items-center px-1 text-card-lighter-3">
          <span aria-label="Sent" className="inline-flex" role="img">
            <RiCheckLine size={14} />
          </span>
        </View>
      </View>
    </motion.div>
  )
}

function ReplyComposerPreview({
  message,
  onCancel,
}: {
  message: RewindChatMessage
  onCancel: () => void
}): ReactElement {
  return (
    <View className="min-h-12 flex-row items-center gap-3 rounded-2xl bg-card-light px-3 py-2">
      <RiReplyLine className="shrink-0 text-card-lighter-2" size={18} />
      <View className="min-w-0 flex-1 items-start">
        <Text className="font-bbh text-[10px] font-black text-card-lighter-3">
          Replying to {getReplyAuthor(message)}
        </Text>
        <Text
          className="font-bbh text-xs leading-4 text-card-lighter-2"
          lines={1}
        >
          {message.content}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Cancel reply"
        className="size-11 shrink-0 items-center justify-center rounded-full bg-cardx"
        onPress={onCancel}
      >
        <RiCloseLine className="text-card-lighter-2" size={18} />
      </Pressable>
    </View>
  )
}

export default function RewindChatScreen({
  chatId,
}: {
  chatId: string
}): ReactElement {
  const { isKeyboardVisible } = useKeyboard()
  const [composerValue, setComposerValue] = useState('')
  const [mentionsOpen, setMentionsOpen] = useState(false)
  const [pendingMessages, setPendingMessages] = useState<PendingMessageState[]>(
    [],
  )
  const [replyingToMessage, setReplyingToMessage] =
    useState<RewindChatMessage | null>(null)
  const [reactionDetailsMessageId, setReactionDetailsMessageId] = useState<
    string | null
  >(null)
  const [reactionPickerState, setReactionPickerState] =
    useState<ReactionPickerState | null>(null)
  const [reactionUpdates, setReactionUpdates] = useState<
    ReadonlyMap<string, RewindChatReaction[]>
  >(() => new Map<string, RewindChatReaction[]>())
  const [streamMessages, setStreamMessages] = useState<RewindChatMessage[]>([])
  const [streamingPartners, setStreamingPartners] = useState<
    StreamingPartner[]
  >([])
  const [seenMessageIds, setSeenMessageIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const [hiddenMessageIds, setHiddenMessageIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  )
  const [chatMenuOpen, setChatMenuOpen] = useState(false)
  const [chatTitleDraft, setChatTitleDraft] = useState('')
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null)
  const firstReactionOptionRef = useRef<HTMLButtonElement | null>(null)
  const reactionDetailsCloseRef = useRef<HTMLButtonElement | null>(null)
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
  const reactionMutation = useReactToRewindChatMessage(chatId)
  const deleteMessageMutation = useDeleteRewindChatMessage(chatId)
  const clearChatMutation = useClearRewindChat(chatId)
  const renameChatMutation = useRenameRewindChat(chatId)
  const shouldReduceMotion = useReducedMotion()
  const { isConnected, subscribeRewindChat } = useNotificationContext()
  const chat = chatsQuery.data?.find((item) => item.id === chatId)
  const firstPage = messagesQuery.data?.pages[0]
  const messages: RewindChatMessage[] = []
  const pages = messagesQuery.data?.pages ?? []
  for (let index = pages.length - 1; index >= 0; index -= 1) {
    const page = pages[index]
    if (page) {
      messages.push(
        ...page.items.filter((message) => !hiddenMessageIds.has(message.id)),
      )
    }
  }
  const knownMessageIds = new Set(messages.map((message) => message.id))
  const visibleStreamMessages = streamMessages.filter(
    (message) =>
      !knownMessageIds.has(message.id) && !hiddenMessageIds.has(message.id),
  )

  useEffect(() => {
    if (!reactionPickerState && !reactionDetailsMessageId) return

    const animationFrame = window.requestAnimationFrame(() => {
      if (reactionPickerState) {
        firstReactionOptionRef.current?.focus({ preventScroll: true })
        return
      }
      reactionDetailsCloseRef.current?.focus({ preventScroll: true })
    })
    const closeReactionOverlays = (): void => {
      setReactionDetailsMessageId(null)
      setReactionPickerState(null)
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') closeReactionOverlays()
    }
    window.addEventListener('resize', closeReactionOverlays)
    window.addEventListener('orientationchange', closeReactionOverlays)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', closeReactionOverlays)
      window.removeEventListener('orientationchange', closeReactionOverlays)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [reactionDetailsMessageId, reactionPickerState])

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
        return
      }
      if (event.type === 'user_message_seen') {
        if (inactiveRunIdsRef.current.has(event.runId)) return
        setSeenMessageIds((current) => {
          if (current.has(event.messageId)) return current
          return new Set([...current, event.messageId])
        })
        setStreamMessages((current) =>
          current.map((message) =>
            message.id === event.messageId
              ? { ...message, seenAt: event.seenAt }
              : message,
          ),
        )
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
      if (event.type === 'reaction_updated') {
        setReactionUpdates((current) => {
          const next = new Map(current)
          next.set(event.messageId, event.reactions)
          return next
        })
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

  const messageLookup = new Map<string, RewindChatMessage>()
  for (const message of [...messages, ...visibleStreamMessages]) {
    messageLookup.set(message.id, message)
  }
  const reactionPickerBaseMessage = reactionPickerState
    ? messageLookup.get(reactionPickerState.messageId)
    : undefined
  const reactionPickerMessage = reactionPickerBaseMessage
    ? {
        ...reactionPickerBaseMessage,
        reactions:
          reactionUpdates.get(reactionPickerBaseMessage.id) ??
          reactionPickerBaseMessage.reactions,
      }
    : undefined
  const reactionDetailsBaseMessage = reactionDetailsMessageId
    ? messageLookup.get(reactionDetailsMessageId)
    : undefined
  const reactionDetailsMessage = reactionDetailsBaseMessage
    ? {
        ...reactionDetailsBaseMessage,
        reactions:
          reactionUpdates.get(reactionDetailsBaseMessage.id) ??
          reactionDetailsBaseMessage.reactions,
      }
    : undefined

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
    const replyTo = replyingToMessage
    shouldStickToBottomRef.current = true
    setComposerValue('')
    setMentionsOpen(false)
    setReplyingToMessage(null)
    composerInputRef.current?.focus({ preventScroll: true })
    setPendingMessages((current) => [
      ...current,
      { content, id: idempotencyKey, replyTo },
    ])
    void sendMutation
      .mutateAsync({
        content,
        idempotencyKey,
        replyToMessageId: replyTo?.id ?? null,
      })
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
        setReplyingToMessage((current) => current ?? replyTo)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Your message could not be sent',
        )
      })
  }

  const beginReply = (message: RewindChatMessage): void => {
    setReactionDetailsMessageId(null)
    setReactionPickerState(null)
    setReplyingToMessage(message)
    setMentionsOpen(false)
    composerInputRef.current?.focus({ preventScroll: true })
  }

  const deleteMessage = (message: RewindChatMessage): void => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return
    setHiddenMessageIds((current) => new Set([...current, message.id]))
    if (replyingToMessage?.id === message.id) setReplyingToMessage(null)
    setReactionDetailsMessageId(null)
    setReactionPickerState(null)
    void deleteMessageMutation
      .mutateAsync(message.id)
      .catch((error: unknown) => {
        setHiddenMessageIds((current) => {
          const next = new Set(current)
          next.delete(message.id)
          return next
        })
        toast.error(
          error instanceof Error
            ? error.message
            : 'Message could not be deleted',
        )
      })
  }

  const renameGroupChat = (): void => {
    const title = chatTitleDraft.trim()
    if (!title || title === chat?.title) return
    void renameChatMutation
      .mutateAsync(title)
      .then(() => {
        setChatMenuOpen(false)
        toast.success('Group name updated')
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Group name could not update',
        )
      })
  }

  const clearChat = (): void => {
    if (
      !window.confirm(
        'Clear every message in this chat? This cannot be undone.',
      )
    )
      return
    void clearChatMutation
      .mutateAsync()
      .then(() => {
        setChatMenuOpen(false)
        setPendingMessages([])
        setStreamMessages([])
        setStreamingPartners([])
        setReplyingToMessage(null)
        setReactionUpdates(new Map())
        setHiddenMessageIds(new Set())
        toast.success('Chat cleared')
      })
      .catch((error: unknown) => {
        toast.error(
          error instanceof Error ? error.message : 'Chat could not be cleared',
        )
      })
  }

  const reactToMessage = (
    message: RewindChatMessage,
    selectedKind: RewindChatReactionKind,
  ): void => {
    const previousReactions =
      reactionUpdates.get(message.id) ?? message.reactions ?? []
    const existingUserReaction = previousReactions.find(
      (reaction) => reaction.actor === 'USER',
    )
    const nextKind =
      existingUserReaction?.kind === selectedKind ? null : selectedKind
    const reactionsWithoutUser = previousReactions.filter(
      (reaction) => reaction.actor !== 'USER',
    )
    const nextReactions: RewindChatReaction[] = nextKind
      ? [
          ...reactionsWithoutUser,
          { actor: 'USER', kind: nextKind, personaId: null },
        ]
      : reactionsWithoutUser
    setReactionUpdates((current) => {
      const next = new Map(current)
      next.set(message.id, nextReactions)
      return next
    })
    setReactionDetailsMessageId(null)
    setReactionPickerState(null)
    void reactionMutation
      .mutateAsync({ messageId: message.id, reaction: nextKind })
      .catch((error: unknown) => {
        setReactionUpdates((current) => {
          const next = new Map(current)
          next.set(message.id, previousReactions)
          return next
        })
        toast.error(
          error instanceof Error ? error.message : 'Reaction could not update',
        )
      })
  }

  const toggleReactionPicker = (
    message: RewindChatMessage,
    anchor: HTMLButtonElement | null,
  ): void => {
    setReactionDetailsMessageId(null)
    if (reactionPickerState?.messageId === message.id) {
      setReactionPickerState(null)
      return
    }
    if (!anchor) return
    setReactionPickerState(
      createReactionPickerState(
        message,
        anchor.getBoundingClientRect(),
        window.innerHeight,
        window.innerWidth,
      ),
    )
  }

  const showReactionDetails = (message: RewindChatMessage): void => {
    setReactionPickerState(null)
    setReactionDetailsMessageId(message.id)
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

  let composerPlaceholder = `Message ${chat?.title ?? 'your partner'}…`
  if (chat?.type === 'GROUP') composerPlaceholder = 'Message the group…'
  if (replyingToMessage) {
    composerPlaceholder = `Reply to ${getReplyAuthor(replyingToMessage)}…`
  }
  let reactionPickerMotionOffset = 0
  if (!shouldReduceMotion && reactionPickerState) {
    reactionPickerMotionOffset =
      reactionPickerState.placement === 'ABOVE' ? 4 : -4
  }

  return (
    <View className="flex-1 overflow-hidden bg-cardd">
      <NoiseComponent>
        <View className="flex h-full min-h-0 flex-col">
          <TabHeader
            canGoBack
            children={
              <View className="flex-row items-center gap-1">
                <Pressable
                  accessibilityLabel={
                    chat?.proactiveMuted
                      ? 'Unmute partner messages'
                      : 'Mute partner messages'
                  }
                  className="size-11 items-center justify-center rounded-full bg-card-light"
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
                <Pressable
                  accessibilityLabel="Chat settings"
                  aria-expanded={chatMenuOpen}
                  className="size-11 items-center justify-center rounded-full bg-card-light"
                  disabled={!chat}
                  onPress={() => {
                    setChatTitleDraft(chat?.title ?? '')
                    setChatMenuOpen(true)
                  }}
                >
                  <RiMore2Line className="text-card-lighter-1" size={20} />
                </Pressable>
              </View>
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
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-mg"
            onScroll={(event) => {
              if (reactionDetailsMessageId) setReactionDetailsMessageId(null)
              if (reactionPickerState) setReactionPickerState(null)
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
                  const displayedMessage = reactionUpdates.has(message.id)
                    ? {
                        ...message,
                        reactions: reactionUpdates.get(message.id) ?? [],
                      }
                    : message
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
                            displayedMessage,
                            seenMessageIds,
                          )}
                          isReactionOverlayOpen={
                            reactionPickerState?.messageId === message.id ||
                            reactionDetailsMessageId === message.id
                          }
                          isReactionPickerOpen={
                            reactionPickerState?.messageId === message.id
                          }
                          message={displayedMessage}
                          onDelete={deleteMessage}
                          onReply={beginReply}
                          onShowReactions={showReactionDetails}
                          onToggleReactionPicker={toggleReactionPicker}
                          replyTo={
                            message.replyToMessageId
                              ? messageLookup.get(message.replyToMessageId)
                              : undefined
                          }
                          showIdentity={showIdentity}
                          showTime={showTime}
                          isGroup={!chat?.personaId}
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
                  <PendingMessage
                    content={pending.content}
                    key={pending.id}
                    replyTo={pending.replyTo}
                  />
                ))}
                {visibleStreamMessages.map((message) => (
                  <ChatMessageBubble
                    deliveryStatus={getMessageDeliveryStatus(
                      message,
                      seenMessageIds,
                    )}
                    isReactionOverlayOpen={
                      reactionPickerState?.messageId === message.id ||
                      reactionDetailsMessageId === message.id
                    }
                    isReactionPickerOpen={
                      reactionPickerState?.messageId === message.id
                    }
                    key={message.id}
                    message={
                      reactionUpdates.has(message.id)
                        ? {
                            ...message,
                            reactions: reactionUpdates.get(message.id) ?? [],
                          }
                        : message
                    }
                    onDelete={deleteMessage}
                    onReply={beginReply}
                    onShowReactions={showReactionDetails}
                    onToggleReactionPicker={toggleReactionPicker}
                    replyTo={
                      message.replyToMessageId
                        ? messageLookup.get(message.replyToMessageId)
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

          <View
            className={cn(
              'shrink-0 gap-2 bg-cardx px-mg pt-3',
              isKeyboardVisible
                ? 'pb-3'
                : 'pb-[calc(var(--safe-area-inset-bottom,0px)+12px)]',
            )}
          >
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
            {replyingToMessage ? (
              <ReplyComposerPreview
                message={replyingToMessage}
                onCancel={() => setReplyingToMessage(null)}
              />
            ) : null}
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
                placeholder={composerPlaceholder}
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

          <AnimatePresence initial={false}>
            {(reactionPickerState && reactionPickerMessage) ||
            reactionDetailsMessage ? (
              <motion.button
                animate={{ opacity: 1 }}
                aria-label="Close message reactions"
                className="fixed inset-0 z-40 cursor-default appearance-none bg-transparent"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key="reaction-picker-backdrop"
                onClick={() => {
                  setReactionDetailsMessageId(null)
                  setReactionPickerState(null)
                }}
                style={{
                  backdropFilter: 'brightness(0.35)',
                  WebkitBackdropFilter: 'brightness(0.35)',
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                type="button"
              />
            ) : null}
            {reactionPickerState && reactionPickerMessage ? (
              <motion.div
                animate={{ opacity: 1, scale: 1, y: 0 }}
                aria-label={`React to ${getReplyAuthor(reactionPickerMessage)}'s message`}
                aria-modal="true"
                className="fixed z-50 flex gap-2 rounded-full bg-card-light p-1 shadow-2xl"
                exit={{
                  opacity: 0,
                  scale: shouldReduceMotion ? 1 : 0.94,
                  y: reactionPickerMotionOffset,
                }}
                initial={{
                  opacity: 0,
                  scale: shouldReduceMotion ? 1 : 0.94,
                  y: reactionPickerMotionOffset,
                }}
                key={`reaction-picker-${reactionPickerMessage.id}`}
                role="dialog"
                style={{
                  left: reactionPickerState.left,
                  top: reactionPickerState.top,
                  transformOrigin: `${reactionPickerMessage.role === 'USER' ? 'right' : 'left'} ${reactionPickerState.placement === 'ABOVE' ? 'bottom' : 'top'}`,
                }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
              >
                {REACTION_OPTIONS.map((option, index) => {
                  const selected = reactionPickerMessage.reactions?.some(
                    (reaction) =>
                      reaction.actor === 'USER' &&
                      reaction.kind === option.kind,
                  )
                  return (
                    <Pressable
                      accessibilityLabel={`${selected ? 'Remove' : 'Add'} ${option.label} reaction`}
                      aria-pressed={selected}
                      className={`size-11 items-center justify-center rounded-full text-xl ${selected ? 'bg-white' : 'bg-cardx'}`}
                      disabled={reactionPickerMessage.id.startsWith('pending:')}
                      key={option.kind}
                      onPress={() =>
                        reactToMessage(reactionPickerMessage, option.kind)
                      }
                      ref={index === 0 ? firstReactionOptionRef : undefined}
                    >
                      <span aria-hidden>{option.emoji}</span>
                    </Pressable>
                  )
                })}
              </motion.div>
            ) : null}
            {reactionDetailsMessage ? (
              <ReactionDetailsDialog
                closeButtonRef={reactionDetailsCloseRef}
                message={reactionDetailsMessage}
                onClose={() => setReactionDetailsMessageId(null)}
                reduceMotion={Boolean(shouldReduceMotion)}
              />
            ) : null}
          </AnimatePresence>
          <AnimatePresence initial={false}>
            {chatMenuOpen ? (
              <>
                <motion.button
                  animate={{ opacity: 1 }}
                  aria-label="Close chat settings"
                  className="fixed inset-0 z-40 cursor-default appearance-none bg-transparent"
                  exit={{ opacity: 0 }}
                  initial={{ opacity: 0 }}
                  onClick={() => setChatMenuOpen(false)}
                  style={{
                    backdropFilter: 'brightness(0.32)',
                    WebkitBackdropFilter: 'brightness(0.32)',
                  }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
                  type="button"
                />
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  aria-label="Chat settings"
                  aria-modal="true"
                  className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[28px] bg-cardd px-mg pb-[calc(var(--safe-area-inset-bottom,0px)+20px)] pt-4 shadow-2xl"
                  exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                  initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
                  role="dialog"
                  transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                >
                  <View className="mx-auto w-full max-w-lg gap-4">
                    <View className="flex-row items-center justify-between">
                      <View className="items-start">
                        <Text className="font-bbh text-lg font-black text-white">
                          Chat settings
                        </Text>
                        <Text className="font-bbh text-xs text-card-lighter-3">
                          Manage this conversation
                        </Text>
                      </View>
                      <Pressable
                        accessibilityLabel="Close chat settings"
                        className="size-11 items-center justify-center rounded-full bg-cardx"
                        onPress={() => setChatMenuOpen(false)}
                      >
                        <RiCloseLine
                          className="text-card-lighter-2"
                          size={19}
                        />
                      </Pressable>
                    </View>

                    {chat?.type === 'GROUP' ? (
                      <View className="gap-2 rounded-2xl bg-cardx p-3">
                        <Input
                          aria-label="Group name"
                          className="bg-card-light"
                          inputClassName="text-base"
                          maxLength={60}
                          onChange={(event) =>
                            setChatTitleDraft(event.target.value)
                          }
                          value={chatTitleDraft}
                        />
                        <Pressable
                          accessibilityLabel="Save group name"
                          className="min-h-11 flex-row items-center justify-center gap-2 rounded-full bg-white px-4"
                          disabled={
                            renameChatMutation.isPending ||
                            !chatTitleDraft.trim() ||
                            chatTitleDraft.trim() === chat.title
                          }
                          onPress={renameGroupChat}
                        >
                          <RiEditLine className="text-cardd" size={17} />
                          <Text className="font-bbh text-sm font-black text-cardd">
                            Save group name
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}

                    <View className="gap-2 rounded-2xl bg-cardx p-3">
                      <Text className="font-bbh text-sm font-black text-danger-400">
                        Clear conversation
                      </Text>
                      <Text className="font-bbh text-xs leading-5 text-card-lighter-2">
                        Deletes every message here and stops replies already in
                        progress. This cannot be undone.
                      </Text>
                      <Pressable
                        accessibilityLabel="Clear every chat message"
                        className="min-h-11 flex-row items-center justify-center gap-2 rounded-full bg-danger-500 px-4"
                        disabled={clearChatMutation.isPending}
                        onPress={clearChat}
                      >
                        <RiDeleteBinLine className="text-white" size={17} />
                        <Text className="font-bbh text-sm font-black text-white">
                          Clear chat
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </View>
      </NoiseComponent>
    </View>
  )
}
