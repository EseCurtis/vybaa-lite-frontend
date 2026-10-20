// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { RewindSession } from '@/shared/api/rewind.api'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import type { User } from '@/shared/types/auth.types'
import { adjustColor } from '@/shared/utils/helpers.util'

import { formatSessionDate, formatSessionTime } from './rewind-history.utils'
import { RewindSessionRow } from './rewind-session-row.component'

const SESSION: RewindSession = {
  id: 'reflection-one',
  userId: 'reflection-owner',
  personaId: 'ella',
  sessionDateKey: '2026-10-18',
  scheduledFor: null,
  windowEndsAt: null,
  startedAt: null,
  status: 'COMPLETED',
  completed: true,
  completedAt: null,
  checkInAt: null,
  summary: 'Setting a boundary helped me feel calmer.',
  emotionalInsight: null,
  emotionalTags: [],
  nextStepNote: null,
  comparisonInsight: null,
  journalDraft: null,
  wellbeingSignals: null,
  journalId: null,
  journalSavedAt: null,
  createdAt: '2026-10-18T09:00:00Z',
  updatedAt: '2026-10-18T09:00:00Z',
}

const USER: User = {
  id: SESSION.userId,
  email: 'reflection@example.test',
  username: 'ada',
  avatarUrl: '/assets/test-user.png',
  firstName: 'Ada',
  isConfirmed: true,
  isFirstTime: false,
  createdAt: SESSION.createdAt,
  updatedAt: SESSION.updatedAt,
}

afterEach(cleanup)

describe('reflection history cards', () => {
  it.each(REWIND_PERSONAS)(
    'uses the $id handle and its readable partner color',
    (persona) => {
      render(
        <RewindSessionRow
          index={0}
          session={{ ...SESSION, personaId: persona.id }}
          onPress={vi.fn()}
        />,
      )
      expect(screen.getByText(/Rewind Sesh w\//)).toBeTruthy()
      const expected = document.createElement('span')
      expected.style.color = adjustColor(persona.color, { lightness: 18 })
      expect(screen.getByText(`@${persona.id}`).style.color).toBe(
        expected.style.color,
      )
    },
  )

  it('pairs the actual user image with the partner avatar, falling back if the photo fails', () => {
    const { container } = render(
      <RewindSessionRow
        index={0}
        session={SESSION}
        user={USER}
        onPress={vi.fn()}
      />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(2)
    const userImage = container.querySelector(`img[src="${USER.avatarUrl}"]`)
    if (!userImage) throw new Error('User avatar was not rendered')
    fireEvent.error(userImage)
    expect(container.querySelector(`img[src="${USER.avatarUrl}"]`)).toBeNull()
    expect(
      container.querySelector('img[src="/assets/rewind/ella.png"]'),
    ).toBeTruthy()
  })

  it('retains the partner avatar and homepage initials when there is no profile photo', () => {
    const { container } = render(
      <RewindSessionRow
        index={0}
        session={SESSION}
        user={{ ...USER, avatarUrl: undefined }}
        onPress={vi.fn()}
      />,
    )
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(screen.getByText('Ad')).toBeTruthy()
    expect(container.querySelector('.size-12 svg')).toBeNull()
    expect(screen.getByText('@ella')).toBeTruthy()
  })

  it('keeps the real summary, shows the time once, and leaves the date to the day heading', () => {
    const onPress = vi.fn()
    render(<RewindSessionRow index={0} session={SESSION} onPress={onPress} />)
    expect(screen.getByText(SESSION.summary)).toBeTruthy()
    expect(
      screen.getAllByText(formatSessionTime(SESSION.createdAt)),
    ).toHaveLength(1)
    expect(screen.queryByText(formatSessionDate(SESSION.createdAt))).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: /Open reflection with Ella.*Saved/ }),
    )
    expect(onPress).toHaveBeenCalledOnce()
  })

  it.each([
    { status: 'SCHEDULED', label: 'Scheduled' },
    { status: 'IN_PROGRESS', label: 'Open' },
    { status: 'FINALIZING', label: 'Saving' },
    { status: 'MISSED', label: 'Missed' },
    { status: 'COMPLETED', label: 'Saved' },
    { status: 'LEGACY', label: 'Archived' },
  ] satisfies Array<{ status: RewindSession['status']; label: string }>)(
    'keeps $status distinguishable with an icon and short accessible label',
    ({ status, label }) => {
      const { container } = render(
        <RewindSessionRow
          index={0}
          session={{ ...SESSION, completed: false, status }}
          onPress={vi.fn()}
        />,
      )
      expect(screen.getByText(label)).toBeTruthy()
      expect(screen.getByRole('button').getAttribute('aria-label')).toContain(
        label,
      )
      expect(container.querySelector(`[title="${label}"] svg`)).toBeTruthy()
    },
  )

  it.each([
    'This scheduled Rewind has not started yet.',
    'This Rewind with Ella was started, but no reflection was captured yet.',
  ])('replaces generic placeholder copy with the status: %s', (summary) => {
    render(
      <RewindSessionRow
        index={0}
        session={{ ...SESSION, completed: false, status: 'SCHEDULED', summary }}
        onPress={vi.fn()}
      />,
    )
    expect(screen.queryByText(summary)).toBeNull()
    expect(screen.getByText('Scheduled')).toBeTruthy()
    expect(screen.getByRole('button').getAttribute('aria-label')).not.toContain(
      summary,
    )
  })

  it('never drops an actual partial reflection just because it is still open', () => {
    render(
      <RewindSessionRow
        index={0}
        session={{ ...SESSION, completed: false, status: 'IN_PROGRESS' }}
        onPress={vi.fn()}
      />,
    )
    expect(screen.getByText(SESSION.summary)).toBeTruthy()
    expect(screen.getByText('Open')).toBeTruthy()
  })

  it('uses the completed state for legacy records already saved', () => {
    render(
      <RewindSessionRow
        index={0}
        session={{ ...SESSION, status: 'LEGACY' }}
        onPress={vi.fn()}
      />,
    )
    expect(screen.getByText('Saved')).toBeTruthy()
    expect(screen.queryByText('Archived')).toBeNull()
  })
})
