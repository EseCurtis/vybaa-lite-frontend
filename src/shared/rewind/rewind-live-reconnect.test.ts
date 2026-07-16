import { describe, expect, it } from 'vitest'

import { shouldAutoReconnectRewindSocket } from './rewind-live-reconnect'

describe('shouldAutoReconnectRewindSocket', () => {
  it('does not recreate a Rewind after a normal server close', () => {
    expect(
      shouldAutoReconnectRewindSocket({
        closeCode: 1000,
        isSessionComplete: false,
        reconnectAttempts: 0,
        shouldReconnect: true,
      }),
    ).toBe(false)
  })

  it('retries only transient transport and service-restart closures', () => {
    expect(
      shouldAutoReconnectRewindSocket({
        closeCode: 1006,
        isSessionComplete: false,
        reconnectAttempts: 0,
        shouldReconnect: true,
      }),
    ).toBe(true)
    expect(
      shouldAutoReconnectRewindSocket({
        closeCode: 1012,
        isSessionComplete: false,
        reconnectAttempts: 3,
        shouldReconnect: true,
      }),
    ).toBe(true)
  })

  it('never retries completed sessions or exhausted retry budgets', () => {
    expect(
      shouldAutoReconnectRewindSocket({
        closeCode: 1006,
        isSessionComplete: true,
        reconnectAttempts: 0,
        shouldReconnect: true,
      }),
    ).toBe(false)
    expect(
      shouldAutoReconnectRewindSocket({
        closeCode: 1006,
        isSessionComplete: false,
        reconnectAttempts: 4,
        shouldReconnect: true,
      }),
    ).toBe(false)
  })
})
