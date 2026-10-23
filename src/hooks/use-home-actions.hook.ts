import { useCallback, useMemo, useSyncExternalStore } from 'react'

import {
  HOME_ACTIONS_CHANGED,
  parseHomeActionPreferences,
  readHomeActionSnapshot,
} from '@/shared/home/home-action-preferences'

function subscribe(listener: () => void): () => void {
  window.addEventListener('storage', listener)
  window.addEventListener(HOME_ACTIONS_CHANGED, listener)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(HOME_ACTIONS_CHANGED, listener)
  }
}

function serverSnapshot(): null {
  return null
}

export function useHomeActionPreferences(userId: string | undefined) {
  const snapshot = useCallback(() => readHomeActionSnapshot(userId), [userId])
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  return useMemo(() => parseHomeActionPreferences(raw), [raw])
}
