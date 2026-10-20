// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useFlexxMotion } from './use-flexx-motion.hook'

const settings = { reduced: false }
let media: EventTarget
beforeEach(() => {
  media = new EventTarget()
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return settings.reduced
    },
    addEventListener: media.addEventListener.bind(media),
    removeEventListener: media.removeEventListener.bind(media),
  }))
})
afterEach(() => {
  cleanup()
  settings.reduced = false
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('pauses/resumes on demand without disabling navigation or scheduling per-frame state', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const { result } = renderHook(useFlexxMotion)
  expect(result.current.enabled).toBe(true)
  act(() => result.current.toggle())
  expect(result.current.paused).toBe(true)
  expect(result.current.enabled).toBe(false)
  act(() => result.current.toggle())
  expect(result.current.enabled).toBe(true)
})

it('stops when the tab is hidden and removes the visibility listener on unmount', () => {
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const remove = vi.spyOn(document, 'removeEventListener')
  const { result, unmount } = renderHook(useFlexxMotion)
  hidden.mockReturnValue(true)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current.enabled).toBe(false)
  hidden.mockReturnValue(false)
  act(() => document.dispatchEvent(new Event('visibilitychange')))
  expect(result.current.enabled).toBe(true)
  unmount()
  expect(remove).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
})

it('honors reduced motion even when animation playback is requested', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  settings.reduced = true
  const { result } = renderHook(useFlexxMotion)
  expect(result.current.reducedMotion).toBe(true)
  expect(result.current.enabled).toBe(false)
  act(() => result.current.toggle())
  act(() => result.current.toggle())
  expect(result.current.enabled).toBe(false)
})

it('reacts to live accessibility preference changes without restarting the screen', () => {
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const { result } = renderHook(useFlexxMotion)
  expect(result.current.enabled).toBe(true)
  settings.reduced = true
  act(() => media.dispatchEvent(new Event('change')))
  expect(result.current.enabled).toBe(false)
  settings.reduced = false
  act(() => media.dispatchEvent(new Event('change')))
  expect(result.current.enabled).toBe(true)
})
