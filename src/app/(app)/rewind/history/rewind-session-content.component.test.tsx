// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { RewindSession } from '@/shared/api/rewind.api'
import { reflectionFixture } from '@/shared/rewind/reflection-test.fixture'
import { RewindSessionDetail } from './rewind-session-detail-sheet.component'

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))
vi.mock('@/providers/toast.provider', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))
afterEach(cleanup)

function content(session: RewindSession) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <RewindSessionDetail session={session} />
    </QueryClientProvider>
  )
}

it('renders a sole reflection directly instead of empty Conversation, Observation or Journal tabs', () => {
  render(content(reflectionFixture))
  expect(screen.getByText(reflectionFixture.summary)).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Conversation/ })).toBeNull()
  expect(screen.queryByRole('button', { name: /Observation/ })).toBeNull()
  expect(screen.queryByRole('button', { name: /Journal/ })).toBeNull()
})

it('selects a populated fallback when the active tab becomes empty after refresh', () => {
  const session: RewindSession = {
    ...reflectionFixture,
    journalDraft: 'A journal note.',
    turns: [
      {
        id: 'turn',
        content: 'Today was a lot.',
        role: 'USER',
        sequence: 0,
        createdAt: reflectionFixture.createdAt,
      },
    ],
  }
  const view = render(content(session))
  const conversation = screen.getByRole('button', {
    name: 'Conversation, selected',
  })
  expect(conversation.getAttribute('aria-pressed')).toBe('true')
  expect(screen.queryByRole('button', { name: /Observation/ })).toBeNull()
  const journal = screen.getByRole('button', { name: 'Journal' })
  if (!(journal instanceof HTMLButtonElement))
    throw new Error('Expected Journal tab')
  Object.defineProperty(journal.parentElement, 'scrollTo', {
    value: vi.fn(),
    configurable: true,
  })
  fireEvent.click(journal)
  expect(screen.getByText('A journal note.')).toBeTruthy()
  view.rerender(content({ ...session, journalDraft: null }))
  expect(screen.queryByRole('button', { name: /Journal/ })).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Conversation, selected' }),
  ).toBeTruthy()
})

it('never shows summaries, journal actions or recommendation controls for a missed session', () => {
  render(
    content({
      ...reflectionFixture,
      status: 'MISSED',
      journalDraft: 'Stale draft',
    }),
  )
  expect(screen.getByText('You missed this Rewind')).toBeTruthy()
  expect(screen.queryByText(reflectionFixture.summary)).toBeNull()
  expect(screen.queryByText('Stale draft')).toBeNull()
  expect(screen.queryByRole('button', { name: /Add Rewind/ })).toBeNull()
})
