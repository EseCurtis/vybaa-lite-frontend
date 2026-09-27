import type { InfiniteData } from '@tanstack/react-query'

import type {
  RewindChat,
  RewindChatRealtimeEvent,
  RewindChatTurn,
  RewindV2ChatMessagesResponse,
} from '@/shared/api/rewind.api'
import type { RewindPersonaId } from '@/shared/rewind/rewind-personas'
import { getRewindPersona } from '@/shared/rewind/rewind-personas'

export type RewindChatMessagesCache = InfiniteData<
  RewindV2ChatMessagesResponse['data'],
  string
>

export type RealtimeTypingTurn = {
  chatId: string
  personaId: RewindPersonaId
  runId: string
  turnId: string
}

const TERMINAL_RUN_STATUSES = new Set(['CANCELLED', 'COMPLETED', 'FAILED'])
type RunLifecycleEvent = Extract<
  RewindChatRealtimeEvent,
  { type: 'run_failed' | 'run_state' }
>

function isTerminalRunEvent(
  event: RewindChatRealtimeEvent,
): event is RunLifecycleEvent {
  return (
    event.type === 'run_failed' ||
    (event.type === 'run_state' && TERMINAL_RUN_STATUSES.has(event.status))
  )
}

function addPersona(
  participants: RewindPersonaId[],
  personaId: RewindPersonaId,
): RewindPersonaId[] {
  if (participants.includes(personaId)) return participants
  return [...participants, personaId]
}

function removePersona(
  participants: RewindPersonaId[],
  personaId: RewindPersonaId,
): RewindPersonaId[] {
  return participants.filter((participant) => participant !== personaId)
}

function updateCachedActiveTurns(
  turns: RewindChatTurn[],
  event: RewindChatRealtimeEvent,
): RewindChatTurn[] {
  if (event.type === 'typing_started') {
    if (turns.some((turn) => turn.id === event.turnId)) return turns
    return [
      ...turns,
      {
        id: event.turnId,
        personaId: event.personaId,
        runId: event.runId,
        status: 'GENERATING',
      },
    ]
  }

  if (event.type === 'typing_stopped' || event.type === 'message_committed') {
    return turns.filter((turn) => turn.id !== event.turnId)
  }

  if (isTerminalRunEvent(event)) {
    return turns.filter((turn) => turn.runId !== event.runId)
  }

  return turns
}

function updateMessagesPage(
  page: RewindV2ChatMessagesResponse['data'],
  event: RewindChatRealtimeEvent,
  isFirstPage: boolean,
): RewindV2ChatMessagesResponse['data'] {
  let items = page.items

  if (event.type === 'message_committed') {
    const withoutCommittedMessage = items.filter(
      (message) => message.id !== event.messageId,
    )
    items = isFirstPage
      ? [...withoutCommittedMessage, event.message]
      : withoutCommittedMessage
  } else if (event.type === 'reaction_updated') {
    items = items.map((message) =>
      message.id === event.messageId
        ? { ...message, reactions: event.reactions }
        : message,
    )
  } else if (event.type === 'user_message_seen') {
    items = items.map((message) =>
      message.id === event.messageId
        ? { ...message, seenAt: event.seenAt }
        : message,
    )
  }

  return {
    ...page,
    activeTurns: updateCachedActiveTurns(page.activeTurns, event),
    items,
  }
}

export function updateRealtimeTypingTurns(
  current: ReadonlyMap<string, RealtimeTypingTurn>,
  event: RewindChatRealtimeEvent,
): ReadonlyMap<string, RealtimeTypingTurn> {
  if (event.type === 'typing_started') {
    return new Map(current).set(event.turnId, {
      chatId: event.chatId,
      personaId: event.personaId,
      runId: event.runId,
      turnId: event.turnId,
    })
  }

  if (event.type === 'typing_stopped' || event.type === 'message_committed') {
    const next = new Map(current)
    next.delete(event.turnId)
    return next
  }

  if (!isTerminalRunEvent(event)) return current

  return new Map([...current].filter(([, turn]) => turn.runId !== event.runId))
}

export function getRealtimeTypingParticipants(
  turns: ReadonlyMap<string, RealtimeTypingTurn>,
  chatId: string,
): RewindPersonaId[] {
  const participants = new Set<RewindPersonaId>()
  for (const turn of turns.values()) {
    if (turn.chatId === chatId) participants.add(turn.personaId)
  }
  return [...participants]
}

export function updateRewindChatsFromRealtime(
  current: RewindChat[] | undefined,
  event: RewindChatRealtimeEvent,
  trackedParticipants: RewindPersonaId[],
  isChatVisible: boolean,
): RewindChat[] | undefined {
  if (!current) return current

  const updatedChats = current.map((chat) => {
    if (chat.id !== event.chatId) return chat

    const existingParticipants = chat.activeParticipants ?? []
    let activeParticipants = existingParticipants
    if (event.type === 'typing_started') {
      activeParticipants = addPersona(existingParticipants, event.personaId)
    } else if (event.type === 'typing_stopped') {
      activeParticipants = trackedParticipants.includes(event.personaId)
        ? existingParticipants
        : removePersona(existingParticipants, event.personaId)
    } else if (event.type === 'message_committed' && event.message.personaId) {
      activeParticipants = trackedParticipants.includes(event.message.personaId)
        ? existingParticipants
        : removePersona(existingParticipants, event.message.personaId)
    } else if (isTerminalRunEvent(event) && trackedParticipants.length) {
      activeParticipants = trackedParticipants
    }

    if (event.type === 'user_message_seen') {
      if (chat.lastMessage?.id !== event.messageId) {
        return { ...chat, activeParticipants }
      }

      return {
        ...chat,
        activeParticipants,
        lastMessage: { ...chat.lastMessage, seenAt: event.seenAt },
      }
    }

    if (event.type !== 'message_committed') {
      return { ...chat, activeParticipants }
    }

    const isNewMessage = chat.lastMessage?.id !== event.messageId
    const unreadCount =
      isNewMessage && !isChatVisible
        ? (chat.unreadCount ?? 0) + 1
        : chat.unreadCount

    return {
      ...chat,
      activeParticipants,
      lastMessage: event.message,
      lastMessageAt: event.message.createdAt,
      unreadCount,
      updatedAt: event.message.createdAt,
    }
  })

  if (event.type !== 'message_committed') return updatedChats
  const changedChatIndex = updatedChats.findIndex(
    (chat) => chat.id === event.chatId,
  )
  if (changedChatIndex <= 0) return updatedChats
  const changedChat = updatedChats[changedChatIndex]
  if (!changedChat) return updatedChats
  return [
    changedChat,
    ...updatedChats.filter((_, index) => index !== changedChatIndex),
  ]
}

export function updateRewindMessagesFromRealtime(
  current: RewindChatMessagesCache | undefined,
  event: RewindChatRealtimeEvent,
): RewindChatMessagesCache | undefined {
  if (!current) return current

  return {
    ...current,
    pages: current.pages.map((page, index) =>
      updateMessagesPage(page, event, index === 0),
    ),
  }
}

export function formatRewindChatTypingStatus(
  participants: RewindPersonaId[] | undefined,
): string | null {
  if (!participants?.length) return null

  const uniqueParticipants = [...new Set(participants)]
  const names = uniqueParticipants.map(
    (personaId) => getRewindPersona(personaId).name,
  )
  if (names.length === 1) return `${names[0]} is typing…`
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`
  return `${names[0]}, ${names[1]} +${names.length - 2} are typing…`
}
