import { describe, expect, it } from 'vitest'

import { shouldAcknowledgeRewindClosing } from './rewind-closing.util'

describe('Rewind spoken closing playback barrier', () => {
  it('acknowledges only after the closing turn and all audio drains', () => {
    expect(
      shouldAcknowledgeRewindClosing({
        acknowledgementSent: false,
        activeSourceCount: 0,
        closing: true,
        playingQueue: false,
        queuedChunkCount: 0,
        turnComplete: true,
      }),
    ).toBe(true)

    expect(
      shouldAcknowledgeRewindClosing({
        acknowledgementSent: false,
        activeSourceCount: 1,
        closing: true,
        playingQueue: false,
        queuedChunkCount: 0,
        turnComplete: true,
      }),
    ).toBe(false)
  })

  it('never acknowledges twice or before the closing turn completes', () => {
    expect(
      shouldAcknowledgeRewindClosing({
        acknowledgementSent: true,
        activeSourceCount: 0,
        closing: true,
        playingQueue: false,
        queuedChunkCount: 0,
        turnComplete: true,
      }),
    ).toBe(false)
    expect(
      shouldAcknowledgeRewindClosing({
        acknowledgementSent: false,
        activeSourceCount: 0,
        closing: true,
        playingQueue: false,
        queuedChunkCount: 0,
        turnComplete: false,
      }),
    ).toBe(false)
  })
})
