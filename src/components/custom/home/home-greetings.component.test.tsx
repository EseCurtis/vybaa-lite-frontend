// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { isValidElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import type { RewindHomeGreeting } from '@/shared/api/rewind.api'
import { HomeGreetings } from './home-greetings.component'

const controls = vi.hoisted(() => ({
  data: null as RewindHomeGreeting | null,
  navigate: vi.fn(),
  present: vi.fn(),
  dismiss: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => controls.navigate,
}))
vi.mock('@/hooks/use-bottom-sheet.hook', () => ({
  useBottomSheet: () => controls,
}))
vi.mock('@/hooks/use-rewind.hook', () => ({
  useRewindHomeGreeting: () => ({ data: controls.data, isFetched: true }),
  useRewindChats: () => ({
    data: [{ id: 'jake-chat', type: 'PARTNER', personaId: 'jake' }],
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  controls.data = null
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('updates the expression with contextual copy and uses the same expression in the full-message sheet', () => {
  controls.data = {
    chatId: 'ella-chat',
    date: null,
    message: 'Proud of you. You completed it!',
    messageId: null,
    personaId: 'ella',
    sourceTypes: [],
    title: 'Hello',
  }
  const view = render(<HomeGreetings rewindPersona="ella" userName="Ese" />)
  expect(
    view.container.querySelector('img[src*="ella/cheering.webp"]'),
  ).toBeTruthy()
  controls.data = {
    ...controls.data,
    message: 'You seem overwhelmed. I’m here for you 😂',
  }
  view.rerender(<HomeGreetings rewindPersona="ella" userName="Ese" />)
  expect(
    view.container.querySelector('img[src*="ella/listening.webp"]'),
  ).toBeTruthy()
  expect(
    view.container.querySelector('img[src*="ella/laughing.webp"]'),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Open Rewind with Ella' }))
  const [sheet] = controls.present.mock.lastCall ?? []
  if (!isValidElement(sheet)) throw new Error('Greeting sheet was not opened')
  const expanded = render(sheet)
  expect(
    expanded.container.querySelector('img[src*="ella/listening.webp"]'),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Open chat with Ella' }))
  expect(controls.dismiss).toHaveBeenCalledOnce()
  expect(controls.navigate).toHaveBeenCalledWith({
    params: { chatId: 'ella-chat' },
    to: '/app/rewind-chat/$chatId',
  })
})

it('ignores a stale partner greeting and preserves fallback chat navigation', () => {
  controls.data = {
    chatId: 'ella-chat',
    date: null,
    message: 'Proud of you!',
    messageId: null,
    personaId: 'ella',
    sourceTypes: [],
    title: 'Ella',
  }
  const view = render(<HomeGreetings rewindPersona="jake" userName="Ese" />)
  expect(
    view.container.querySelector('img[src*="v2-detached-heads/jake/"]'),
  ).toBeTruthy()
  expect(screen.queryByText('Proud of you!')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Open chat with Jake/ }))
  expect(controls.navigate).toHaveBeenCalledWith({
    params: { chatId: 'jake-chat' },
    to: '/app/rewind-chat/$chatId',
  })
})
