import { describe, expect, it } from 'vitest'

import type {
  RewindChat,
  RewindChatMessage,
  RewindChatRealtimeEvent,
} from '@/shared/api/rewind.api'

import {
  formatRewindChatTypingStatus,
  getRealtimeTypingParticipants,
  type RealtimeTypingTurn,
  type RewindChatMessagesCache,
  updateRealtimeTypingTurns,
  updateRewindChatsFromRealtime,
  updateRewindMessagesFromRealtime,
} from './rewind-chat-realtime.util'

function createMessage(
  id: string,
  personaId: RewindChatMessage['personaId'] = 'lyra',
): RewindChatMessage {
  return {
    content: 'u around? 🙂',
    createdAt: '2026-09-05T13:00:00.000Z',
    id,
    localDateKey: '2026-09-05',
    mentions: [],
    personaId,
    reactions: [],
    replyToMessageId: null,
    role: personaId ? 'PARTNER' : 'USER',
    runId: 'run-1',
    turnId: personaId ? 'turn-1' : null,
  }
}

function createChat(id: string): RewindChat {
  return {
    activeParticipants: [],
    archivedAt: null,
    createdAt: '2026-09-05T12:00:00.000Z',
    id,
    lastMessage: null,
    lastMessageAt: null,
    personaId: id === 'chat-1' ? 'lyra' : 'ella',
    threadKey: id,
    title: id === 'chat-1' ? 'Lyra' : 'Ella',
    type: 'PARTNER',
    unreadCount: 0,
    updatedAt: '2026-09-05T12:00:00.000Z',
  }
}

function createTypingEvent(
  personaId: 'ella' | 'jake',
  type: 'typing_started' | 'typing_stopped',
): RewindChatRealtimeEvent {
  return {
    chatId: 'chat-1',
    personaId,
    runId: 'run-1',
    turnId: `turn-${personaId}`,
    type,
  }
}

describe('Rewind chat realtime cache updates', () => {
  it('tracks concurrent typers independently and formats a human row status', () => {
    let turns: ReadonlyMap<string, RealtimeTypingTurn> = new Map()
    turns = updateRealtimeTypingTurns(
      turns,
      createTypingEvent('ella', 'typing_started'),
    )
    turns = updateRealtimeTypingTurns(
      turns,
      createTypingEvent('jake', 'typing_started'),
    )

    expect(getRealtimeTypingParticipants(turns, 'chat-1')).toEqual([
      'ella',
      'jake',
    ])
    expect(formatRewindChatTypingStatus(['ella', 'jake'])).toBe(
      'Ella and Jake are typing…',
    )

    turns = updateRealtimeTypingTurns(
      turns,
      createTypingEvent('ella', 'typing_stopped'),
    )
    expect(getRealtimeTypingParticipants(turns, 'chat-1')).toEqual(['jake'])
  })

  it('moves a newly active chat to the top and increments unread once', () => {
    const message = createMessage('message-1')
    const event: RewindChatRealtimeEvent = {
      chatId: 'chat-1',
      message,
      messageId: message.id,
      runId: 'run-1',
      turnId: 'turn-1',
      type: 'message_committed',
    }
    const firstUpdate = updateRewindChatsFromRealtime(
      [createChat('chat-2'), createChat('chat-1')],
      event,
      [],
      false,
    )

    expect(firstUpdate?.[0]?.id).toBe('chat-1')
    expect(firstUpdate?.[0]?.lastMessage?.id).toBe('message-1')
    expect(firstUpdate?.[0]?.unreadCount).toBe(1)

    const duplicateUpdate = updateRewindChatsFromRealtime(
      firstUpdate,
      event,
      [],
      false,
    )
    expect(duplicateUpdate?.[0]?.unreadCount).toBe(1)
  })

  it('patches committed messages, reactions, and read receipts in place', () => {
    const userMessage = createMessage('user-1', null)
    const cache: RewindChatMessagesCache = {
      pageParams: [''],
      pages: [
        {
          activeTurns: [],
          chat: {
            contextRevision: 1,
            id: 'chat-1',
            proactiveMuted: false,
            unreadCount: 0,
          },
          items: [userMessage],
          nextCursor: null,
        },
      ],
    }
    const partnerMessage = createMessage('partner-1')
    const committed = updateRewindMessagesFromRealtime(cache, {
      chatId: 'chat-1',
      message: partnerMessage,
      messageId: partnerMessage.id,
      runId: 'run-1',
      turnId: 'turn-1',
      type: 'message_committed',
    })
    const reacted = updateRewindMessagesFromRealtime(committed, {
      chatId: 'chat-1',
      messageId: partnerMessage.id,
      reactions: [{ actor: 'PARTNER', kind: 'LIKE', personaId: 'ariel' }],
      type: 'reaction_updated',
    })
    const seen = updateRewindMessagesFromRealtime(reacted, {
      chatId: 'chat-1',
      messageId: userMessage.id,
      runId: 'run-1',
      seenAt: '2026-09-05T13:00:04.000Z',
      type: 'user_message_seen',
    })

    expect(seen?.pages[0]?.items).toEqual([
      { ...userMessage, seenAt: '2026-09-05T13:00:04.000Z' },
      {
        ...partnerMessage,
        reactions: [{ actor: 'PARTNER', kind: 'LIKE', personaId: 'ariel' }],
      },
    ])
  })

  it('updates the chat-row read receipt when the latest user message is seen', () => {
    const userMessage = {
      ...createMessage('user-1', null),
      deliveredAt: '2026-09-05T13:00:01.000Z',
    }
    const chat = { ...createChat('chat-1'), lastMessage: userMessage }

    const updated = updateRewindChatsFromRealtime(
      [chat],
      {
        chatId: chat.id,
        messageId: userMessage.id,
        runId: 'run-1',
        seenAt: '2026-09-05T13:00:04.000Z',
        type: 'user_message_seen',
      },
      [],
      true,
    )

    expect(updated?.[0]?.lastMessage).toEqual({
      ...userMessage,
      seenAt: '2026-09-05T13:00:04.000Z',
    })
  })
})
