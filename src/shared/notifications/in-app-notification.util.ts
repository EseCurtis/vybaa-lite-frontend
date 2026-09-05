import { normalizeDeepLink } from '@/shared/utils/deep-link.util'
import {
  getRewindPersona,
  type RewindPersonaId,
} from '@/shared/rewind/rewind-personas'

export type InAppNotificationSender = {
  avatarUrl: string
  name: string
  personaId: RewindPersonaId
}

export type InAppNotification = {
  id: string
  message: string
  route: string | null
  sender: InAppNotificationSender | null
  title: string
}

export type PushNotificationInput = {
  body?: string
  data: unknown
  id?: string
  title?: string
}

const IN_APP_NOTIFICATION_DEDUPE_WINDOW_MS = 10_000
const displayedNotificationIds = new Map<string, number>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseRecord(value: unknown): Record<string, unknown> {
  if (isRecord(value)) return value
  if (typeof value !== 'string') return {}

  try {
    const parsed = JSON.parse(value) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function isRewindPersonaId(value: unknown): value is RewindPersonaId {
  return (
    value === 'ella' ||
    value === 'lyra' ||
    value === 'jake' ||
    value === 'ariel'
  )
}

function getSenderFromRecord(
  payload: Record<string, unknown>,
): InAppNotificationSender | null {
  const sender = parseRecord(payload.notificationSender)
  if (!isRewindPersonaId(sender.personaId)) return null

  const persona = getRewindPersona(sender.personaId)
  return {
    avatarUrl: persona.avatar,
    name: persona.name,
    personaId: persona.id,
  }
}

function isInternalAppRoute(route: string): boolean {
  return route.startsWith('/') && !route.startsWith('//')
}

function normalizeNotificationRoute(value: unknown): string | null {
  const route = getString(value)
  if (!route) return null
  // Older notification payloads used the former app-prefixed notifications
  // route. Keep those payloads actionable after the route moved to `/notifications`.
  if (route === '/app/notifications') return '/notifications'
  if (isInternalAppRoute(route)) return route

  const target = normalizeDeepLink(route)
  if (!target) return null
  return target.hash ? `${target.path}#${target.hash}` : target.path
}

function getRouteFromRecord(payload: Record<string, unknown>): string | null {
  const keys = [
    'route',
    'deepLink',
    'deeplink',
    'link',
    'url',
    'click_action',
  ] as const

  for (const key of keys) {
    const route = normalizeNotificationRoute(payload[key])
    if (route) return route
  }

  return null
}

function getRoute(
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown>,
): string | null {
  return getRouteFromRecord(payload) ?? getRouteFromRecord(nestedPayload)
}

function getSender(
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown>,
): InAppNotificationSender | null {
  const notificationType =
    getString(payload.type) ?? getString(nestedPayload.type)
  if (notificationType !== 'rewind_chat_message') return null

  return getSenderFromRecord(payload) ?? getSenderFromRecord(nestedPayload)
}

function getNotificationId(
  input: PushNotificationInput,
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown>,
  title: string,
  message: string,
): string {
  const notificationType =
    getString(payload.type) ?? getString(nestedPayload.type)
  const rewindMessageId =
    getString(nestedPayload.messageId) ?? getString(payload.messageId)
  if (notificationType === 'rewind_chat_message' && rewindMessageId) {
    return getRewindChatNotificationDisplayId(rewindMessageId)
  }

  return (
    getString(payload.id) ??
    getString(nestedPayload.id) ??
    getString(input.id) ??
    `${title}:${message}`
  )
}

function normalizePathname(pathname: string): string {
  const pathWithoutQuery = pathname.split(/[?#]/, 1)[0] ?? pathname
  if (pathWithoutQuery === '/') return pathWithoutQuery
  return pathWithoutQuery.replace(/\/+$/, '')
}

export function getRewindChatNotificationDisplayId(messageId: string): string {
  return `rewind-chat-message:${messageId}`
}

export function shouldDisplayInAppNotification(
  route: string | null,
  currentPathname: string,
  visibilityState: DocumentVisibilityState,
): boolean {
  if (visibilityState !== 'visible') return false
  if (!route) return true
  return normalizePathname(route) !== normalizePathname(currentPathname)
}

export function claimInAppNotificationDisplay(
  id: string,
  now: number = Date.now(),
): boolean {
  for (const [displayedId, displayedAt] of displayedNotificationIds) {
    if (now - displayedAt > IN_APP_NOTIFICATION_DEDUPE_WINDOW_MS) {
      displayedNotificationIds.delete(displayedId)
    }
  }

  const displayedAt = displayedNotificationIds.get(id)
  if (
    displayedAt !== undefined &&
    now - displayedAt <= IN_APP_NOTIFICATION_DEDUPE_WINDOW_MS
  ) {
    return false
  }

  displayedNotificationIds.set(id, now)
  return true
}

export function formatInAppNotification(
  notification: Pick<InAppNotification, 'message' | 'sender' | 'title'>,
): string {
  if (notification.sender) return notification.message

  return notification.message
    ? `${notification.title}: ${notification.message}`
    : notification.title
}

export function getPushNotificationRoute(
  input: PushNotificationInput,
): string | null {
  const payload = parseRecord(input.data)
  const nestedPayload = parseRecord(payload.data)
  return getRoute(payload, nestedPayload)
}

export function getNotificationSender(
  data: unknown,
  type: string,
): InAppNotificationSender | null {
  if (type !== 'rewind_chat_message') return null

  const payload = parseRecord(data)
  const nestedPayload = parseRecord(payload.data)
  return getSenderFromRecord(payload) ?? getSenderFromRecord(nestedPayload)
}

export function getInAppNotification(
  input: PushNotificationInput,
): InAppNotification | null {
  const payload = parseRecord(input.data)
  const nestedPayload = parseRecord(payload.data)
  const title =
    getString(input.title) ??
    getString(payload.title) ??
    getString(nestedPayload.title)
  const message =
    getString(input.body) ??
    getString(payload.message) ??
    getString(nestedPayload.message)

  if (!title || !message) return null

  return {
    id: getNotificationId(input, payload, nestedPayload, title, message),
    message,
    route: getRoute(payload, nestedPayload),
    sender: getSender(payload, nestedPayload),
    title,
  }
}
