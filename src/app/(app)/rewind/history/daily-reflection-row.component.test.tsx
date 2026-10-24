// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DailyReflection } from '@/shared/api/reflections.api'

import {
  DailyReflectionAvatars,
  DailyReflectionRow,
  DailyReflectionContent,
} from './daily-reflection-row.component'

const navigation = vi.hoisted(() => ({ navigate: vi.fn() }))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigation.navigate,
}))

const reflection: DailyReflection = {
  id: 'daily',
  localDateKey: '2026-10-24',
  timezone: 'Africa/Lagos',
  state: 'READY',
  summary: 'A quiet walk helped you reset after a busy afternoon.',
  insights: ['You made time to pause.', 'A walk may be worth trying again.'],
  participantIds: ['ella', 'lyra'],
  sourceCounts: { FLEXX: 1, JOURNAL: 1, GOAL: 0 },
  analyzedAt: '2026-10-24T17:00:00Z',
  updatedAt: '2026-10-24T17:00:00Z',
}
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('daily reflection summaries', () => {
  it('opens one readable daily summary with numbered insights and contributing sources', () => {
    const { container } = render(<DailyReflectionRow reflection={reflection} />)
    expect(container.querySelectorAll('img')).toHaveLength(2)
    fireEvent.click(
      screen.getByRole('button', { name: /Open Reflections n’ summary/ }),
    )
    expect(navigation.navigate).toHaveBeenCalledWith({
      to: '/app/reflections/$dayKey',
      params: { dayKey: reflection.localDateKey },
    })
    cleanup()
    render(<DailyReflectionContent reflection={reflection} />)
    expect(screen.getByText(reflection.summary)).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Feed')).toBeTruthy()
    expect(screen.getByText('Journal')).toBeTruthy()
    expect(screen.queryByText('Tasks')).toBeNull()
  })

  it('does not invent a partner when a day has only independent activities', () => {
    const { container } = render(
      <DailyReflectionAvatars participantIds={['not-a-partner']} />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(0)
    expect(screen.getByText('U')).toBeTruthy()
  })

  it('deduplicates partner bubbles and retains all six contributing partners', () => {
    const { container } = render(
      <DailyReflectionAvatars
        participantIds={[
          'ella',
          'ella',
          'lyra',
          'jake',
          'ariel',
          'tobi',
          'neeja',
        ]}
      />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(6)
  })

  it.each([
    ['COLLECTING', 'Taking shape'],
    ['EMPTY', 'Quiet day'],
    ['PRIVATE', 'Personalization off'],
  ] satisfies Array<[DailyReflection['state'], string]>)(
    'keeps %s days visible without fabricated stats',
    (state, label) => {
      render(
        <DailyReflectionRow
          reflection={{
            ...reflection,
            state,
            summary: 'No reflection activity was recorded for this day.',
            insights: [],
            participantIds: [],
            sourceCounts: {},
          }}
        />,
      )
      expect(screen.getByText(label)).toBeTruthy()
      expect(screen.getByRole('button').hasAttribute('disabled')).toBe(false)
    },
  )
})
