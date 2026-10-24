// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { ReflectionProcessingStatus } from './reflection-status.component'

const settings = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', async (load) => ({
  ...(await load<typeof import('framer-motion')>()),
  useReducedMotion: () => settings.reduced,
}))
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
  settings.reduced = false
})

it('cycles the selected partner expressions without changing or duplicating the status message', () => {
  vi.useFakeTimers()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  const view = render(<ReflectionProcessingStatus partnerId="lyra" />)
  expect(view.container.querySelector('img')?.getAttribute('src')).toContain(
    '/lyra/thinking.webp',
  )
  act(() => {
    vi.advanceTimersByTime(1800)
  })
  expect(
    [...view.container.querySelectorAll('img')].some((image) =>
      image.getAttribute('src')?.includes('/lyra/typing.webp'),
    ),
  ).toBe(true)
  expect(screen.getAllByText('Preparing summary for you…')).toHaveLength(1)
  view.unmount()
})

it('keeps a static thinking expression when reduced motion is requested', () => {
  settings.reduced = true
  vi.useFakeTimers()
  const view = render(<ReflectionProcessingStatus partnerId="jake" />)
  act(() => {
    vi.advanceTimersByTime(10_000)
  })
  expect(view.container.querySelectorAll('img')).toHaveLength(1)
  expect(view.container.querySelector('img')?.getAttribute('src')).toContain(
    '/jake/thinking.webp',
  )
})
