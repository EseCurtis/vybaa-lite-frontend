// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DailyReflection } from '@/shared/api/reflections.api'

import { DailyReflectionStory } from './daily-reflection-story.component'

const settings = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', async (load) => ({
  ...(await load<typeof import('framer-motion')>()),
  useReducedMotion: () => settings.reduced,
}))

const reflection: DailyReflection = {
  id: 'story-one',
  localDateKey: '2026-10-24',
  timezone: 'Africa/Lagos',
  state: 'READY',
  summary: 'A quiet walk helped you reset.',
  insights: [
    'You made time to pause.',
    'Your journal helped you name it.',
    'Small steps still counted.',
    'You can leave room to breathe.',
  ],
  participantIds: ['ella', 'lyra'],
  sourceCounts: {
    GOAL: 3,
    JOURNAL: 1,
    REWIND_ROUTINE: 1,
    REWIND_VOICE: 1,
    FLEXX: 0,
  },
  analyzedAt: '2026-10-24T17:00:00Z',
  updatedAt: '2026-10-24T17:00:00Z',
}

afterEach(() => {
  cleanup()
  settings.reduced = false
})

describe('daily reflection story', () => {
  it('starts with one friendly note and keeps charts and extra thoughts optional', () => {
    const view = render(
      <DailyReflectionStory
        reflection={reflection}
        avatars={<span>User cluster</span>}
      />,
    )
    expect(
      screen.queryByRole('region', { name: 'Included activity' }),
    ).toBeNull()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    expect(screen.getByText(reflection.summary)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'A little more' }))
    const activity = screen.getByRole('region', { name: 'Included activity' })
    expect(
      within(activity).getByRole('img', {
        name: '6 moments included. Tasks: 3, Journal: 1, Rewind: 2',
      }),
    ).toBeTruthy()
    expect(within(activity).queryByText('Feed')).toBeNull()
    expect(activity.querySelectorAll('circle')).toHaveLength(4)
    const colours = [...activity.querySelectorAll('circle')]
      .slice(1)
      .map((circle) => circle.getAttribute('stroke'))
    expect(new Set(colours).size).toBe(3)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    for (const insight of reflection.insights)
      expect(screen.getByText(insight)).toBeTruthy()
    expect(screen.queryByText(/mood score|productivity score|100%/i)).toBeNull()
    expect(view.container.querySelector('ol')).toBeTruthy()
  })

  it('keeps the full text behind an accessible disclosure and preserves the choice during refresh', () => {
    const summary = `${'A very full day left you needing a quiet moment. '.repeat(13)}\n\nYou ended by checking in with yourself.`
    const view = render(
      <DailyReflectionStory
        reflection={{ ...reflection, summary }}
        avatars={null}
      />,
    )
    const more = screen.getByRole('button', { name: 'A little more' })
    const target = document.getElementById(
      more.getAttribute('aria-controls') ?? '',
    )
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(target?.hidden).toBe(true)
    fireEvent.click(more)
    expect(
      screen
        .getByRole('button', { name: 'Less for now' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
    expect(target?.hidden).toBe(false)
    expect(
      screen.getByText('You ended by checking in with yourself.'),
    ).toBeTruthy()
    view.rerender(
      <DailyReflectionStory
        reflection={{
          ...reflection,
          summary,
          updatedAt: '2026-10-24T18:00:00Z',
        }}
        avatars={null}
      />,
    )
    expect(screen.getByRole('button', { name: 'Less for now' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Less for now' }))
    expect(target?.hidden).toBe(true)
  })

  it('renders the AI-written greeting unchanged without inserting a canned opener', () => {
    const summary =
      'Hey ese_szn, you don’t have to untangle all of this tonight.'
    const view = render(
      <DailyReflectionStory
        reflection={{ ...reflection, summary }}
        avatars={null}
        firstName="Ese"
        username="ese_szn"
      />,
    )
    expect(screen.getByText(summary)).toBeTruthy()
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
    const images = [...view.container.querySelectorAll('img')]
    expect(images.length).toBeGreaterThan(0)
    expect(
      images.every((image) =>
        /\/(ella|lyra)\//u.test(image.getAttribute('src') ?? ''),
      ),
    ).toBe(true)
    expect(images.every((image) => image.alt === '')).toBe(true)
    view.rerender(
      <DailyReflectionStory
        reflection={{ ...reflection, summary, processing: true }}
        avatars={null}
        firstName="Ese"
        username="ese_szn"
      />,
    )
    expect(screen.getAllByText(summary)).toHaveLength(1)
  })

  it('shows a short personal note completely, rather than hiding the helpful next step', () => {
    const summary =
      'You sounded stretched thin when you talked with Ella.\n\nMaybe tonight can be about one thing, not all of it.'
    render(
      <DailyReflectionStory
        reflection={{ ...reflection, summary, insights: [], sourceCounts: {} }}
        avatars={null}
      />,
    )
    expect(
      screen.getByText('You sounded stretched thin when you talked with Ella.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Maybe tonight can be about one thing, not all of it.'),
    ).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it.each([
    'EMPTY',
    'PRIVATE',
    'COLLECTING',
  ] satisfies DailyReflection['state'][])(
    'keeps %s days honest without charts, reactions or empty insights',
    (state) => {
      render(
        <DailyReflectionStory
          reflection={{
            ...reflection,
            state,
            summary: 'No summary available.',
            insights: [],
            participantIds: [],
            sourceCounts: {},
          }}
          avatars={null}
        />,
      )
      expect(
        screen.queryByRole('region', { name: 'Included activity' }),
      ).toBeNull()
      expect(
        screen.queryByRole('region', { name: 'What stood out' }),
      ).toBeNull()
      expect(screen.queryAllByRole('img')).toHaveLength(0)
      expect(screen.getByText('No summary available.')).toBeTruthy()
    },
  )

  it('uses static immediately readable sections for reduced motion', () => {
    settings.reduced = true
    const view = render(
      <DailyReflectionStory reflection={reflection} avatars={null} />,
    )
    const summary = screen.getByRole('region', { name: "The day's reflection" })
    expect(summary.style.opacity).not.toBe('0')
    for (const item of view.container.querySelectorAll('li'))
      expect(['', 'none']).toContain(item.style.transform)
  })
})
