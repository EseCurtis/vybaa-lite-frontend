export interface QuickTaskPreferences {
  hidden: boolean
  dismissedIds: string[]
}

function storageKey(userId: string): string {
  return `vybaa:quick-task:v1:${userId}`
}

export function readQuickTaskPreferences(userId: string): QuickTaskPreferences {
  const fallback: QuickTaskPreferences = { hidden: false, dismissedIds: [] }
  if (typeof window === 'undefined') return fallback
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storageKey(userId)) ?? 'null',
    )
    if (!value || typeof value !== 'object') return fallback
    return {
      hidden: 'hidden' in value && value.hidden === true,
      dismissedIds:
        'dismissedIds' in value && Array.isArray(value.dismissedIds)
          ? value.dismissedIds
              .filter((id): id is string => typeof id === 'string')
              .slice(-100)
          : [],
    }
  } catch (error: unknown) {
    console.warn(
      'Quick task preferences could not be read',
      error instanceof Error ? error.name : 'UnknownError',
    )
    return fallback
  }
}

export function saveQuickTaskPreferences(
  userId: string,
  value: QuickTaskPreferences,
): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(value))
  } catch (error: unknown) {
    console.warn(
      'Quick task preferences could not be saved',
      error instanceof Error ? error.name : 'UnknownError',
    )
  }
}
