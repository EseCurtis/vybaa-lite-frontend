import type { ReactElement } from 'react'

import { ScreenSkeleton } from './loading-layouts.component'

interface AppLoadingStateProps {
  detail?: string
  message: string
  mode?: 'dock' | 'screen'
  layout?: 'auth' | 'home' | 'list'
}

// Compatibility boundary for existing callers; never shows the startup splash.
export function AppLoadingState({ message, detail, mode = 'screen', layout = 'list' }: AppLoadingStateProps): ReactElement {
  return (
    <section role="status" aria-busy="true" aria-label={message}
      className={mode === 'dock' ? 'w-full px-4 py-4' : 'min-h-0 flex-1 overflow-hidden bg-cardd px-4 pt-[calc(var(--safe-area-inset-top,0px)+24px)]'}>
      {detail ? <span className="sr-only">{detail}</span> : null}
      <ScreenSkeleton layout={layout} />
    </section>
  )
}
