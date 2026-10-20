import { useEffect, useState, useSyncExternalStore } from 'react'

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

function subscribeMotionPreference(listener: () => void): () => void {
  if (typeof window.matchMedia !== 'function') return () => undefined
  const media = window.matchMedia(REDUCED_MOTION)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

function motionPreference(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(REDUCED_MOTION).matches
  )
}

function serverMotionPreference(): boolean {
  return true
}

export function useFlexxMotion(): {
  enabled: boolean
  paused: boolean
  reducedMotion: boolean
  toggle: () => void
} {
  const reducedMotion = useSyncExternalStore(
    subscribeMotionPreference,
    motionPreference,
    serverMotionPreference,
  )
  const [paused, setPaused] = useState(false)
  const [visible, setVisible] = useState(() => !document.hidden)
  useEffect(() => {
    const update = (): void => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  return {
    enabled: !paused && !reducedMotion && visible,
    paused,
    reducedMotion,
    toggle: () => setPaused((previous) => !previous),
  }
}
