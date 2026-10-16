import type { ReactElement } from 'react'

import { Pressable } from '@/components/layout/pressables.component'

export function QueryFeedback({ message, onRetry, retrying = false }: {
  message: string
  onRetry: () => void
  retrying?: boolean
}): ReactElement {
  return <div role="status" className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-3">
    <p className="font-bbh text-xs text-card-lighter-3">{message}</p>
    <Pressable onPress={onRetry} disabled={retrying} accessibilityLabel="Retry loading this section"
      className="min-h-11 items-center justify-center rounded-full bg-card-light-100 px-4">
      <span className="font-bbh text-xs font-bold text-white">{retrying ? 'Retrying…' : 'Try again'}</span>
    </Pressable>
  </div>
}
