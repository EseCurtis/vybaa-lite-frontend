// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { RewindSession } from '@/shared/api/rewind.api'

import RewindSessionDetailScreen from './rewind-session-detail.screen'

const state = vi.hoisted(() => ({ status: 'SCHEDULED', loading: false }))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({ user: { rewindPersona: 'lyra' } }),
}))
vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ sessionId: 'scheduled-slot' }),
  useRouter: () => ({}),
  useLocation: () => ({ pathname: '/app/r/scheduled-slot' }),
}))
vi.mock('@/hooks/use-rewind.hook', () => ({
  useRewindSession: () => ({
    data: state.loading
      ? undefined
      : ({
          id: 'scheduled-slot',
          status: state.status,
          personaId: 'ella',
        } satisfies Pick<RewindSession, 'id' | 'personaId'> & {
          status: string
        }),
    isLoading: state.loading,
    isError: false,
  }),
}))
vi.mock('./history/rewind-session-detail-sheet.component', () => ({
  RewindSessionDetail: () => <p>Saved reflection content</p>,
}))
afterEach(() => {
  cleanup()
  state.status = 'SCHEDULED'
  state.loading = false
})

it('does not expose scheduled content through a direct session URL', () => {
  render(<RewindSessionDetailScreen origin="history" />)
  expect(screen.getByText('Scheduled Rewind')).toBeTruthy()
  expect(screen.queryByText('Saved reflection content')).toBeNull()
  expect(screen.getByRole('button', { name: 'Go back' })).toBeTruthy()
})

it('retains access to completed reflection details', () => {
  state.status = 'COMPLETED'
  render(<RewindSessionDetailScreen origin="history" />)
  expect(screen.getByText('Saved reflection content')).toBeTruthy()
  expect(screen.queryByText('Scheduled Rewind')).toBeNull()
})

it('shows a missed page and the correct partner emoji, never saved details', () => {
  state.status = 'MISSED'
  render(<RewindSessionDetailScreen origin="history" />)
  expect(screen.getByText('You missed this Rewind')).toBeTruthy()
  expect(screen.getByAltText('Ella, listening').getAttribute('src')).toContain(
    '/ella/listening.webp',
  )
  expect(screen.queryByText('Saved reflection content')).toBeNull()
})

it('uses an explicit partner processing state while finalizing', () => {
  state.status = 'FINALIZING'
  render(<RewindSessionDetailScreen origin="history" />)
  expect(screen.getByRole('status').textContent).toContain(
    'Preparing summary for you',
  )
  expect(screen.queryByText('Saved reflection content')).toBeNull()
})

it('uses the selected partner while the initial request is pending', () => {
  state.loading = true
  render(<RewindSessionDetailScreen origin="history" />)
  expect(screen.getByText('Opening your reflection…')).toBeTruthy()
  expect(screen.getByText('w/ @lyra')).toBeTruthy()
})
