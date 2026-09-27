const WALKTHROUGH_STORAGE_PREFIX = 'vybaa:walkthrough:v1'

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getWalkthroughStorageKey(
  walkthroughId: string,
  userId: string,
): string {
  return `${WALKTHROUGH_STORAGE_PREFIX}:${walkthroughId}:${userId}`
}

export function hasCompletedWalkthrough(
  walkthroughId: string,
  userId: string,
): boolean {
  const storage = getLocalStorage()
  if (!storage) return true

  try {
    return (
      storage.getItem(getWalkthroughStorageKey(walkthroughId, userId)) ===
      'true'
    )
  } catch {
    return true
  }
}

export function markWalkthroughCompleted(
  walkthroughId: string,
  userId: string,
): void {
  const storage = getLocalStorage()
  if (!storage) return

  try {
    storage.setItem(getWalkthroughStorageKey(walkthroughId, userId), 'true')
  } catch {
    // Walkthrough education is non-critical when device storage is unavailable.
  }
}
