export const HOME_ACTION_IDS = [
  'flexx',
  'tasks',
  'rewind',
  'wellbeing',
  'chill',
] as const
export type HomeActionId = (typeof HOME_ACTION_IDS)[number]
export type HomeActionPreferences = {
  version: 1
  order: HomeActionId[]
  hidden: HomeActionId[]
}
export const HOME_ACTIONS_CHANGED = 'vybaa:home-actions-changed'

export function defaultHomeActionPreferences(): HomeActionPreferences {
  return { version: 1, order: [...HOME_ACTION_IDS], hidden: [] }
}

function isActionId(value: unknown): value is HomeActionId {
  return HOME_ACTION_IDS.some((id) => id === value)
}

export function parseHomeActionPreferences(
  raw: string | null,
): HomeActionPreferences {
  if (!raw || raw.length > 4096) return defaultHomeActionPreferences()
  try {
    const value: unknown = JSON.parse(raw)
    if (
      !value ||
      typeof value !== 'object' ||
      !('version' in value) ||
      value.version !== 1 ||
      !('order' in value) ||
      !Array.isArray(value.order) ||
      !('hidden' in value) ||
      !Array.isArray(value.hidden)
    )
      return defaultHomeActionPreferences()
    return {
      version: 1,
      order: [
        ...new Set([...value.order.filter(isActionId), ...HOME_ACTION_IDS]),
      ],
      hidden: [...new Set(value.hidden.filter(isActionId))],
    }
  } catch {
    // Corrupt optional device preferences must not prevent Home from opening.
    return defaultHomeActionPreferences()
  }
}

function storageKey(userId: string): string {
  return `vybaa:home-actions:v1:${userId}`
}

export function readHomeActionSnapshot(
  userId: string | undefined,
): string | null {
  if (!userId || typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(storageKey(userId))
  } catch {
    return null /* Home remains usable when device storage is blocked. */
  }
}

export function saveHomeActionPreferences(
  userId: string,
  preferences: HomeActionPreferences,
): void {
  const normalized = parseHomeActionPreferences(JSON.stringify(preferences))
  window.localStorage.setItem(storageKey(userId), JSON.stringify(normalized))
  window.dispatchEvent(new Event(HOME_ACTIONS_CHANGED))
}

export function moveHomeAction(
  preferences: HomeActionPreferences,
  id: HomeActionId,
  direction: -1 | 1,
  available: readonly HomeActionId[],
): HomeActionPreferences {
  const visibleOrder = preferences.order.filter((entry) =>
    available.includes(entry),
  )
  const index = visibleOrder.indexOf(id)
  const neighbor = visibleOrder[index + direction]
  if (index < 0 || !neighbor) return preferences
  return {
    ...preferences,
    order: preferences.order.map((entry) => {
      if (entry === id) return neighbor
      if (entry === neighbor) return id
      return entry
    }),
  }
}
