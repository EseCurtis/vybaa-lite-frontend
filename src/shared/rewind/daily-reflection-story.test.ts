import { describe, expect, it } from 'vitest'

import {
  reflectionActivities,
  reflectionDirectAddress,
  reflectionStoryVariation,
  reflectionSummaryPassages,
} from './daily-reflection-story'

describe('daily reflection visuals', () => {
  it('gives every distinct activity its own stable colour', () => {
    const counts = {
      ACHIEVEMENT: 1,
      FLEXX: 1,
      FLEXX_ANSWER: 1,
      GOAL: 1,
      JOURNAL: 1,
      REWARD: 1,
      REWIND_CHAT: 1,
      REWIND_ROUTINE: 1,
    }
    const entries = reflectionActivities(counts)
    expect(new Set(entries.map((entry) => entry.color)).size).toBe(
      entries.length,
    )
    expect(reflectionActivities(counts)).toEqual(entries)
  })
  it('uses real positive counts, merges shared labels and keeps unknown activities', () => {
    const activities = reflectionActivities({
      REWIND_ROUTINE: 2,
      REWIND_VOICE: 1,
      GOAL: 4,
      FLEXX_ANSWER: 0,
      JOURNAL: -1,
      UNKNOWN: 2,
      OTHER: 1,
      INVALID: Number.NaN,
      INFINITE: Infinity,
      FRACTION: 0.5,
    })
    expect(activities.map(({ label, count }) => ({ label, count }))).toEqual([
      { label: 'Rewind', count: 3 },
      { label: 'Tasks', count: 4 },
      { label: 'Activity', count: 3 },
    ])
  })

  it('does not fabricate activity on quiet days', () => {
    expect(reflectionActivities({})).toEqual([])
    expect(reflectionActivities({ GOAL: 0, JOURNAL: 0 })).toEqual([])
  })

  it('keeps composition stable per day while varying across days and insights', () => {
    const presentations = Array.from({ length: 30 }, (_, index) =>
      reflectionStoryVariation(`day-${index}`),
    )
    expect(reflectionStoryVariation('same', 2)).toEqual(
      reflectionStoryVariation('same', 2),
    )
    expect(new Set(presentations.map((entry) => entry.layout)).size).toBe(3)
    expect(new Set(presentations.map((entry) => entry.tone)).size).toBe(3)
    expect(new Set(presentations.map((entry) => entry.emotion)).size).toBe(3)
    expect(presentations.every((entry) => Math.abs(entry.rotation) <= 2)).toBe(
      true,
    )
  })
})

describe('summary passages', () => {
  it('addresses old third-person text directly without changing the saved note', () => {
    expect(
      reflectionDirectAddress(
        'The user is tired and the user has a lot on their mind.',
        '',
      ),
    ).toBe('you are tired and you have a lot on their mind.')
    expect(reflectionDirectAddress('The user feels uncertain.', '')).toBe(
      'you feel uncertain.',
    )
    expect(
      reflectionDirectAddress('The user feels uncertain.', 'ese_szn'),
    ).toBe('ese_szn feels uncertain.')
    expect(reflectionDirectAddress('The user mentioned a walk.', '$&')).toBe(
      '$& mentioned a walk.',
    )
  })
  it('keeps paragraphs intact, including emoji and punctuation', () => {
    expect(
      reflectionSummaryPassages(
        'A walk helped. 🌿\n\nYou paused, then tried again.',
      ),
    ).toEqual(['A walk helped. 🌿', 'You paused, then tried again.'])
  })

  it('breaks longer text at sentence boundaries without discarding any wording', () => {
    const summary =
      'You had a very full day and still found space to answer the questions that mattered, without rushing yourself through another checklist. A walk outside gave you a useful pause before returning to your work. Later you made time for your journal, and named what had felt difficult. That is all part of the same day.'
    const passages = reflectionSummaryPassages(summary)
    expect(passages.length).toBeGreaterThan(1)
    expect(passages.join(' ')).toBe(summary)
  })

  it('keeps long unpunctuated text, short text and empty text safe', () => {
    const uninterrupted = 'word '.repeat(100).trim()
    expect(reflectionSummaryPassages(uninterrupted)).toEqual([uninterrupted])
    expect(reflectionSummaryPassages('A quiet day.')).toEqual(['A quiet day.'])
    expect(reflectionSummaryPassages('  ')).toEqual([])
  })

  it('falls back without losing content when sentence segmentation is unavailable', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Intl, 'Segmenter')
    // Older embedded webviews may not implement sentence segmentation.
    Object.defineProperty(Intl, 'Segmenter', {
      configurable: true,
      value: undefined,
    })
    try {
      expect(
        reflectionSummaryPassages('Still readable. Nothing is discarded.'),
      ).toEqual(['Still readable. Nothing is discarded.'])
    } finally {
      if (descriptor) Object.defineProperty(Intl, 'Segmenter', descriptor)
    }
  })
})
