// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { DailyReflection } from '@/shared/api/reflections.api'

import { DailyReflectionStory } from './daily-reflection-story.component'

const settings = vi.hoisted(() => ({ reduced: false }))
vi.mock('framer-motion', async (load) => ({
  ...(await load<typeof import('framer-motion')>()),
  useReducedMotion: () => settings.reduced,
}))

const reflection: DailyReflection = {
  id: 'story-one', localDateKey: '2026-10-24', timezone: 'Africa/Lagos', state: 'READY', summary: 'A quiet walk helped you reset.',
  insights: ['You made time to pause.', 'Your journal helped you name it.', 'Small steps still counted.', 'You can leave room to breathe.'],
  participantIds: ['ella', 'lyra'], sourceCounts: { GOAL: 3, JOURNAL: 1, REWIND_ROUTINE: 1, REWIND_VOICE: 1, FLEXX: 0 }, analyzedAt: '2026-10-24T17:00:00Z', updatedAt: '2026-10-24T17:00:00Z',
}

afterEach(() => { cleanup(); settings.reduced = false })

describe('daily reflection story', () => {
  it('shows an accurately labelled dial and bars, separated from all numbered insights', () => {
    const view = render(<DailyReflectionStory reflection={reflection} avatars={<span>User cluster</span>} />)
    const activity = screen.getByRole('region', { name: 'Included activity' })
    expect(within(activity).getByRole('img', { name: '6 moments included. Tasks: 3, Journal: 1, Rewind: 2' })).toBeTruthy()
    expect(within(activity).queryByText('Feed')).toBeNull()
    expect(activity.querySelectorAll('circle')).toHaveLength(4)
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    for (const insight of reflection.insights) expect(screen.getByText(insight)).toBeTruthy()
    expect(screen.queryByText(/mood score|productivity score|100%/i)).toBeNull()
    expect(view.container.querySelector('[data-story-layout]')).toBeTruthy()
  })

  it('keeps the full text behind an accessible disclosure and preserves the choice during refresh', () => {
    const summary = 'A calm morning.\n\nA difficult afternoon did not erase that.\n\nYou ended by checking in with yourself.'
    const view = render(<DailyReflectionStory reflection={{ ...reflection, summary }} avatars={null} />)
    const more = screen.getByRole('button', { name: 'Read the full story' })
    const target = document.getElementById(more.getAttribute('aria-controls') ?? '')
    expect(more.getAttribute('aria-expanded')).toBe('false')
    expect(target?.hidden).toBe(true)
    fireEvent.click(more)
    expect(screen.getByRole('button', { name: 'Show less' }).getAttribute('aria-expanded')).toBe('true')
    expect(target?.hidden).toBe(false)
    expect(screen.getByText('You ended by checking in with yourself.')).toBeTruthy()
    view.rerender(<DailyReflectionStory reflection={{ ...reflection, summary, updatedAt: '2026-10-24T18:00:00Z' }} avatars={null} />)
    expect(screen.getByRole('button', { name: 'Show less' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Show less' }))
    expect(target?.hidden).toBe(true)
  })

  it('only decorates with real contributors and keeps the seeded layout on re-render', () => {
    const view = render(<DailyReflectionStory reflection={reflection} avatars={null} />)
    const layout = [...view.container.querySelectorAll('[data-story-layout]')].map((node) => node.getAttribute('data-story-layout'))
    const images = [...view.container.querySelectorAll('img')]
    expect(images.length).toBeGreaterThan(0)
    expect(images.every((image) => /\/(ella|lyra)\//u.test(image.getAttribute('src') ?? ''))).toBe(true)
    expect(images.every((image) => image.alt === '')).toBe(true)
    view.rerender(<DailyReflectionStory reflection={{ ...reflection, processing: true }} avatars={null} />)
    expect([...view.container.querySelectorAll('[data-story-layout]')].map((node) => node.getAttribute('data-story-layout'))).toEqual(layout)
  })

  it.each(['EMPTY', 'PRIVATE', 'COLLECTING'] satisfies DailyReflection['state'][])(
    'keeps %s days honest without charts, reactions or empty insights', (state) => {
      render(<DailyReflectionStory reflection={{ ...reflection, state, summary: 'No summary available.', insights: [], participantIds: [], sourceCounts: {} }} avatars={null} />)
      expect(screen.queryByRole('region', { name: 'Included activity' })).toBeNull()
      expect(screen.queryByRole('region', { name: 'What stood out' })).toBeNull()
      expect(screen.queryAllByRole('img')).toHaveLength(0)
      expect(screen.getByText('No summary available.')).toBeTruthy()
    },
  )

  it('uses static immediately readable sections for reduced motion', () => {
    settings.reduced = true
    const view = render(<DailyReflectionStory reflection={reflection} avatars={null} />)
    const summary = screen.getByRole('region', { name: "The day's reflection" })
    expect(summary.style.opacity).not.toBe('0')
    for (const item of view.container.querySelectorAll('li')) expect(['', 'none']).toContain(item.style.transform)
  })
})
