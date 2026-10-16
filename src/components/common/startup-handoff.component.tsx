import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { focusManager } from '@tanstack/react-query'
import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useAuth } from '@/providers/auth.provider'

export function StartupHandoff(): null {
  const { stale } = useAuth()
  const routePending = useRouterState({ select: (state) => state.isLoading })

  useEffect(() => {
    if (stale || routePending || document.body.classList.contains('loaded')) return
    const frame = requestAnimationFrame(() => document.body.classList.add('loaded'))
    return () => cancelAnimationFrame(frame)
  }, [routePending, stale])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listener = App.addListener('appStateChange', ({ isActive }) => focusManager.setFocused(isActive))
    return () => {
      void listener.then((handle) => handle.remove())
      focusManager.setFocused(undefined)
    }
  }, [])
  return null
}
