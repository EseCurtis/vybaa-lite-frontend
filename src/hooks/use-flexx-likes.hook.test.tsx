// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { starterFlexxDesigns } from '@/shared/flexx/flexx-design'
import { useFlexxLikes } from './use-flexx-likes.hook'

const design = starterFlexxDesigns('daily', 0)[0]
beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('saves by composition rather than transient generated ID and supports unlike', () => {
  const { result } = renderHook(() => useFlexxLikes('owner'))
  act(() => result.current.toggleLike(design))
  expect(result.current.isLiked({ ...design, id: 'another-generation' })).toBe(
    true,
  )
  expect(
    result.current.isLiked({ ...design, headline: 'Another design.' }),
  ).toBe(false)
  act(() => result.current.toggleLike(design))
  expect(result.current.isLiked(design)).toBe(false)
})

it('does not leak likes when switching accounts or signing out', () => {
  const initialProps: { owner: string | undefined } = { owner: 'ada' }
  const { result, rerender } = renderHook(
    ({ owner }: { owner: string | undefined }) => useFlexxLikes(owner),
    { initialProps },
  )
  act(() => result.current.toggleLike(design))
  rerender({ owner: 'tobi' })
  expect(result.current.isLiked(design)).toBe(false)
  rerender({ owner: undefined })
  act(() => result.current.toggleLike(design))
  expect(result.current.isLiked(design)).toBe(false)
  rerender({ owner: 'ada' })
  expect(result.current.isLiked(design)).toBe(true)
})

it('handles malformed storage and keeps the toggle working when persistence is denied', () => {
  localStorage.setItem('vybaa:flexx:likes:v1:owner', JSON.stringify([34]))
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const { result } = renderHook(() => useFlexxLikes('owner'))
  expect(result.current.isLiked(design)).toBe(false)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Quota exceeded')
  })
  act(() => result.current.toggleLike(design))
  expect(result.current.isLiked(design)).toBe(true)
  expect(warning).toHaveBeenCalled()
})
