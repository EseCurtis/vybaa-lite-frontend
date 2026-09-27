export const REWIND_CLIENT_RECONNECT_MAX_ATTEMPTS = 4

const RETRYABLE_REWIND_CLOSE_CODES = new Set<number>([1006, 1012, 1013])

export function shouldAutoReconnectRewindSocket(params: {
  closeCode: number
  isSessionComplete: boolean
  reconnectAttempts: number
  shouldReconnect: boolean
}): boolean {
  return (
    params.shouldReconnect &&
    !params.isSessionComplete &&
    params.reconnectAttempts < REWIND_CLIENT_RECONNECT_MAX_ATTEMPTS &&
    RETRYABLE_REWIND_CLOSE_CODES.has(params.closeCode)
  )
}
