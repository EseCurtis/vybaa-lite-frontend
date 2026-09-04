import ENV from '@/env'
import { realtimeAPI } from '@/shared/api/realtime.api'
import {
  isRewindChatRealtimeEvent,
  type RewindChatRealtimeEvent,
} from '@/shared/api/rewind.api'
import { joinApiUrl } from '@/shared/api/api-url.util'

interface NotificationRealtimeSignal {
  latestNotification: {
    createdAt: string
    id: string
    message: string
    title: string
    type: string
  }
  notificationCount: number
}

interface RealtimeSocketClientCallbacks {
  onConnected: () => void
  onDisconnected: () => void
  onNotification: (signal: NotificationRealtimeSignal) => void
  onRewindEvent: (event: RewindChatRealtimeEvent) => void
}

interface RealtimeEnvelope {
  data: unknown
  event: string
  id: string
  sentAt: string
}

const HEARTBEAT_INTERVAL_MS = 20_000
const MAX_RECONNECT_DELAY_MS = 20_000

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isRealtimeEnvelope(value: unknown): value is RealtimeEnvelope {
  if (!isRecord(value)) return false
  return (
    typeof value.event === 'string' &&
    typeof value.id === 'string' &&
    typeof value.sentAt === 'string'
  )
}

function getNotificationSignal(
  value: unknown,
): NotificationRealtimeSignal | null {
  if (!isRecord(value) || typeof value.notificationCount !== 'number') {
    return null
  }
  const notification = value.latestNotification
  if (!isRecord(notification)) return null
  if (
    typeof notification.createdAt !== 'string' ||
    typeof notification.id !== 'string' ||
    typeof notification.message !== 'string' ||
    typeof notification.title !== 'string' ||
    typeof notification.type !== 'string'
  ) {
    return null
  }
  return {
    latestNotification: {
      createdAt: notification.createdAt,
      id: notification.id,
      message: notification.message,
      title: notification.title,
      type: notification.type,
    },
    notificationCount: value.notificationCount,
  }
}

function createSocketUrl(path: string, token: string): string {
  const baseUrl = ENV.API_BASE_URL.replace(/^http/, 'ws')
  const url = new URL(joinApiUrl(baseUrl, path))
  url.searchParams.set('token', token)
  return url.toString()
}

export class RealtimeSocketClient {
  private readonly callbacks: RealtimeSocketClientCallbacks
  private heartbeatTimer: number | null = null
  private reconnectAttempt = 0
  private reconnectTimer: number | null = null
  private socket: WebSocket | null = null
  private stopped = true

  public constructor(callbacks: RealtimeSocketClientCallbacks) {
    this.callbacks = callbacks
  }

  public start(): void {
    if (!this.stopped) return
    this.stopped = false
    void this.connect()
  }

  public stop(): void {
    this.stopped = true
    this.clearTimers()
    const socket = this.socket
    this.socket = null
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close(1000, 'Client stopped')
    }
    this.callbacks.onDisconnected()
  }

  private clearTimers(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private async connect(): Promise<void> {
    if (this.stopped) return
    try {
      const response = await realtimeAPI.createToken()
      if (this.stopped) return
      const socket = new WebSocket(
        createSocketUrl(response.data.wsUrl, response.data.token),
      )
      this.socket = socket
      socket.onmessage = (message) => this.handleMessage(message.data)
      socket.onclose = () => this.handleDisconnect(socket)
      socket.onerror = () => socket.close()
    } catch {
      this.callbacks.onDisconnected()
      this.scheduleReconnect()
    }
  }

  private handleDisconnect(socket: WebSocket): void {
    if (this.socket !== socket) return
    this.socket = null
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
    this.callbacks.onDisconnected()
    this.scheduleReconnect()
  }

  private handleEnvelope(envelope: RealtimeEnvelope): void {
    if (envelope.event === 'notifications_changed') {
      const signal = getNotificationSignal(envelope.data)
      if (signal) this.callbacks.onNotification(signal)
      return
    }
    if (envelope.event !== 'rewind_chat_event') return
    const rewindEvent = isRewindChatRealtimeEvent(envelope.data)
      ? envelope.data
      : null
    if (rewindEvent) this.callbacks.onRewindEvent(rewindEvent)
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== 'string') return
    let message: unknown
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }
    if (isRecord(message) && message.type === 'ready') {
      this.reconnectAttempt = 0
      this.callbacks.onConnected()
      this.startHeartbeat()
      return
    }
    if (isRealtimeEnvelope(message)) this.handleEnvelope(message)
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return
    const exponent = Math.min(this.reconnectAttempt, 5)
    const delay = Math.min(1_000 * 2 ** exponent, MAX_RECONNECT_DELAY_MS)
    this.reconnectAttempt += 1
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      void this.connect()
    }, delay)
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer)
    }
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ping' }))
      }
    }, HEARTBEAT_INTERVAL_MS)
  }
}
