import { useCallback, useEffect, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'

import { chooseFlexxSoundtrack } from '@/shared/flexx/flexx-audio.config'
import type { FlexxSoundtrack } from '@/shared/flexx/flexx-audio.config'

const BACKGROUND_VOLUME = 0.12
const CROSSFADE_DURATION_MS = 240
const MAX_REMEMBERED_SLIDES = 120

type FlexxAudioPlayer = {
  audio: HTMLAudioElement
  designId: string
  frameId: number | null
}

type AudioPlayerRefs = {
  currentPlayer: MutableRefObject<FlexxAudioPlayer | null>
  players: MutableRefObject<FlexxAudioPlayer[]>
  transition: MutableRefObject<number>
}

type AudioFade = {
  cleanupAtEnd: boolean
  from: number
  player: FlexxAudioPlayer
  refs: AudioPlayerRefs
  startedAt: number
  to: number
  transition: number
}

function disposePlayer(player: FlexxAudioPlayer, refs: AudioPlayerRefs): void {
  if (player.frameId !== null) window.cancelAnimationFrame(player.frameId)
  player.frameId = null
  player.audio.pause()
  player.audio.removeAttribute('src')
  refs.players.current = refs.players.current.filter(
    (current) => current !== player,
  )
  if (refs.currentPlayer.current === player) refs.currentPlayer.current = null
}

function animateAudioFade(fade: AudioFade): void {
  if (fade.transition !== fade.refs.transition.current) return
  const progress = Math.min(
    1,
    (performance.now() - fade.startedAt) / CROSSFADE_DURATION_MS,
  )
  fade.player.audio.volume = fade.from + (fade.to - fade.from) * progress
  if (progress === 1) {
    fade.player.frameId = null
    if (fade.cleanupAtEnd) disposePlayer(fade.player, fade.refs)
    return
  }
  fade.player.frameId = window.requestAnimationFrame(
    animateAudioFade.bind(null, fade),
  )
}

function fadeBetweenPlayers(
  previous: FlexxAudioPlayer | null,
  next: FlexxAudioPlayer,
  refs: AudioPlayerRefs,
  transition: number,
): void {
  const startedAt = performance.now()
  if (previous) {
    animateAudioFade({
      cleanupAtEnd: true,
      from: previous.audio.volume,
      player: previous,
      refs,
      startedAt,
      to: 0,
      transition,
    })
  }
  animateAudioFade({
    cleanupAtEnd: false,
    from: 0,
    player: next,
    refs,
    startedAt,
    to: BACKGROUND_VOLUME,
    transition,
  })
}

export function useFlexxBackgroundAudio(activeDesignId: string | undefined): {
  enabled: boolean
  toggle: () => void
} {
  const [enabled, setEnabled] = useState(false)
  const enabledRef = useRef(false)
  const activeDesignRef = useRef(activeDesignId)
  const lastStartedDesignRef = useRef<string | null>(null)
  const previousTrackIdRef = useRef<string | null>(null)
  const trackBySlideRef = useRef(new Map<string, FlexxSoundtrack>())
  const playersRef = useRef<FlexxAudioPlayer[]>([])
  const currentPlayerRef = useRef<FlexxAudioPlayer | null>(null)
  const transitionRef = useRef(0)

  const stopAll = useCallback((): void => {
    transitionRef.current += 1
    for (const player of [...playersRef.current])
      disposePlayer(player, {
        currentPlayer: currentPlayerRef,
        players: playersRef,
        transition: transitionRef,
      })
  }, [])

  const failPlayback = useCallback(
    (transition: number): void => {
      if (transition !== transitionRef.current) return
      stopAll()
      enabledRef.current = false
      setEnabled(false)
    },
    [stopAll],
  )

  const startSlide = useCallback(
    (designId: string | undefined): void => {
      if (!designId || typeof Audio === 'undefined') return
      lastStartedDesignRef.current = designId
      let soundtrack = trackBySlideRef.current.get(designId)
      if (!soundtrack) {
        soundtrack = chooseFlexxSoundtrack(previousTrackIdRef.current)
        trackBySlideRef.current.set(designId, soundtrack)
        previousTrackIdRef.current = soundtrack.id
        if (trackBySlideRef.current.size > MAX_REMEMBERED_SLIDES) {
          const oldestSlideId = trackBySlideRef.current.keys().next().value
          if (oldestSlideId) trackBySlideRef.current.delete(oldestSlideId)
        }
      }
      const previous = currentPlayerRef.current
      if (previous?.designId === designId) return

      transitionRef.current += 1
      const transition = transitionRef.current
      for (const player of [...playersRef.current]) {
        if (player.frameId !== null) {
          window.cancelAnimationFrame(player.frameId)
          player.frameId = null
        }
        if (player !== previous)
          disposePlayer(player, {
            currentPlayer: currentPlayerRef,
            players: playersRef,
            transition: transitionRef,
          })
      }

      const next: FlexxAudioPlayer = {
        audio: new Audio(soundtrack.src),
        designId,
        frameId: null,
      }
      next.audio.loop = true
      next.audio.preload = 'none'
      next.audio.volume = 0
      playersRef.current = [...playersRef.current, next]
      currentPlayerRef.current = next

      try {
        void next.audio
          .play()
          .then(() => {
            if (transition !== transitionRef.current || !enabledRef.current) {
              disposePlayer(next, {
                currentPlayer: currentPlayerRef,
                players: playersRef,
                transition: transitionRef,
              })
              return
            }
            fadeBetweenPlayers(
              previous,
              next,
              {
                currentPlayer: currentPlayerRef,
                players: playersRef,
                transition: transitionRef,
              },
              transition,
            )
          })
          .catch(() => failPlayback(transition))
      } catch {
        failPlayback(transition)
      }
    },
    [failPlayback],
  )

  const toggle = useCallback((): void => {
    if (enabledRef.current) {
      enabledRef.current = false
      lastStartedDesignRef.current = null
      setEnabled(false)
      stopAll()
      return
    }
    enabledRef.current = true
    setEnabled(true)
    startSlide(activeDesignRef.current)
  }, [startSlide, stopAll])

  const handleVisibilityChange = useCallback((): void => {
    if (!document.hidden || !enabledRef.current) return
    enabledRef.current = false
    lastStartedDesignRef.current = null
    setEnabled(false)
    stopAll()
  }, [stopAll])

  useEffect(() => {
    activeDesignRef.current = activeDesignId
    if (
      !enabledRef.current ||
      !activeDesignId ||
      activeDesignId === lastStartedDesignRef.current
    )
      return
    startSlide(activeDesignId)
  }, [activeDesignId, startSlide])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopAll()
    }
  }, [handleVisibilityChange, stopAll])

  return { enabled, toggle }
}
