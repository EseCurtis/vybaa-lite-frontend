import { onlineManager } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useSyncExternalStore } from 'react'

function getOnlineStatus(): boolean {
  return onlineManager.isOnline()
}

export function ConnectionNotice(): ReactElement | null {
  const online = useSyncExternalStore(
    onlineManager.subscribe,
    getOnlineStatus,
    () => true,
  )
  if (online) return null
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-4 top-[calc(var(--safe-area-inset-top,0px)+8px)] z-50 mx-auto w-fit rounded-full bg-card-light-100 px-4 py-2 font-bbh text-xs text-card-lighter-3"
    >
      Offline · Saved content is still available
    </div>
  )
}
