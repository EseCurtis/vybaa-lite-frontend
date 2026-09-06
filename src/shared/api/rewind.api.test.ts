import { describe, expect, it } from 'vitest'

import { isRewindChatRealtimeEvent } from './rewind.api'

describe('Rewind chat realtime events', () => {
  it('accepts a genuine streamed delta', () => {
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        delta: 'hello',
        personaId: 'ella',
        runId: 'run-1',
        sequence: 1,
        turnId: 'turn-1',
        type: 'message_delta',
      }),
    ).toBe(true)
  })

  it('accepts a committed message with its canonical payload', () => {
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        message: {
          content: 'I hear you.',
          createdAt: '2026-09-04T08:00:00.000Z',
          id: 'message-1',
          localDateKey: '2026-09-04',
          mentions: [],
          personaId: 'ella',
          replyToMessageId: null,
          role: 'PARTNER',
          runId: 'run-1',
          turnId: 'turn-1',
        },
        messageId: 'message-1',
        runId: 'run-1',
        turnId: 'turn-1',
        type: 'message_committed',
      }),
    ).toBe(true)
  })

  it('accepts a persisted user-message seen receipt', () => {
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        messageId: 'message-user-1',
        runId: 'run-1',
        seenAt: '2026-09-04T08:00:03.000Z',
        type: 'user_message_seen',
      }),
    ).toBe(true)
  })

  it('accepts only the four supported reaction updates', () => {
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        messageId: 'message-1',
        reactions: [
          { actor: 'USER', kind: 'LOVE', personaId: null },
          { actor: 'PARTNER', kind: 'LAUGH', personaId: 'jake' },
          { actor: 'PARTNER', kind: 'CRY', personaId: 'ella' },
          { actor: 'PARTNER', kind: 'LIKE', personaId: 'ariel' },
        ],
        type: 'reaction_updated',
      }),
    ).toBe(true)
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        messageId: 'message-1',
        reactions: [{ actor: 'PARTNER', kind: 'FIRE', personaId: 'lyra' }],
        type: 'reaction_updated',
      }),
    ).toBe(false)
  })

  it('rejects malformed or unknown events', () => {
    expect(
      isRewindChatRealtimeEvent({ type: 'message_delta', delta: 'x' }),
    ).toBe(false)
    expect(isRewindChatRealtimeEvent({ type: 'unknown' })).toBe(false)
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        messageId: 'message-user-1',
        runId: 'run-1',
        type: 'user_message_seen',
      }),
    ).toBe(false)
    expect(
      isRewindChatRealtimeEvent({
        chatId: 'chat-1',
        messageId: 'message-1',
        runId: 'run-1',
        turnId: 'turn-1',
        type: 'message_committed',
      }),
    ).toBe(false)
  })
})
