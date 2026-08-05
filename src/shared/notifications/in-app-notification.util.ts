export type InAppNotification = {
  id: string
  message: string
  route: string | null
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

function isInternalAppRoute(route: string): boolean {
  return route.startsWith('/') && !route.startsWith('//')
}

function getRoute(
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown>,
): string | null {
  const route = getString(payload.route) ?? getString(nestedPayload.route)
  return route && isInternalAppRoute(route) ? route : null
}

function getNotificationId(
  input: PushNotificationInput,
  payload: Record<string, unknown>,
  nestedPayload: Record<string, unknown>,
  title: string,
  message: string,
): string {
  return (
    getString(payload.id) ??
    getString(nestedPayload.id) ??
    getString(input.id) ??
    `${title}:${message}`
  )
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
  notification: Pick<InAppNotification, 'message' | 'title'>,
): string {
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
    title,
  }
}
