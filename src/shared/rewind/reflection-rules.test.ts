import { describe, expect, it } from 'vitest'

import type { RewindSession } from '@/shared/api/rewind.api'
import { isReflectionDayKey } from '@/shared/api/reflections.api'
import { availableReflectionSections } from './reflection-sections'
import { reflectionClusterPosition } from './daily-reflection-cluster'
import { reflectionFixture } from './reflection-test.fixture'

describe('reflection content rules', () => {
  it('hides every empty tab and treats placeholder summaries as empty', () => {
    expect(availableReflectionSections(reflectionFixture)).toEqual([
      'reflection',
    ])
    expect(
      availableReflectionSections({
        ...reflectionFixture,
        summary:
          'This Rewind with Ella was started, but no reflection was captured yet.',
        turns: [],
        journalDraft: '  ',
      }),
    ).toEqual([])
  })
  it('keeps genuine transcript, insight-only and journal content available', () => {
    const turns: NonNullable<RewindSession['turns']> = [
      {
        id: 'turn',
        role: 'USER',
        content: 'A real answer',
        sequence: 0,
        createdAt: reflectionFixture.createdAt,
      },
    ]
    expect(
      availableReflectionSections({
        ...reflectionFixture,
        summary: '',
        emotionalInsight: 'A moment to pause.',
        turns,
        journalDraft: 'A note',
      }),
    ).toEqual(['conversation', 'reflection', 'journal'])
  })
  it.each([
    'MISSED',
    'SCHEDULED',
    'FINALIZING',
  ] satisfies RewindSession['status'][])(
    'does not expose content tabs for %s even with stale stored summary text',
    (status) => {
      expect(
        availableReflectionSections({
          ...reflectionFixture,
          status,
          journalDraft: 'Old draft',
        }),
      ).toEqual([])
    },
  )
})

describe('scattered participant clusters', () => {
  it('is stable per reflection and varies across reflections rather than forming a grid', () => {
    const first = Array.from({ length: 6 }, (_, index) =>
      reflectionClusterPosition('day-one', index, 6),
    )
    expect(first).toEqual(
      Array.from({ length: 6 }, (_, index) =>
        reflectionClusterPosition('day-one', index, 6),
      ),
    )
    expect(first).not.toEqual(
      Array.from({ length: 6 }, (_, index) =>
        reflectionClusterPosition('day-two', index, 6),
      ),
    )
    expect(new Set(first.map((point) => point.top)).size).toBe(6)
  })
  it('keeps every bubble inside the icon bounds at all supported group sizes', () => {
    for (let count = 1; count <= 6; count += 1)
      for (let seed = 0; seed < 100; seed += 1)
        for (let index = 0; index < count; index += 1) {
          const point = reflectionClusterPosition(String(seed), index, count)
          expect(point.left).toBeGreaterThanOrEqual(0)
          expect(point.top).toBeGreaterThanOrEqual(0)
          expect(point.left + point.size).toBeLessThanOrEqual(88)
          expect(point.top + point.size).toBeLessThanOrEqual(88)
        }
  })
})

it('rejects invalid or malformed reflection routes', () => {
  expect(isReflectionDayKey('2026-10-24')).toBe(true)
  for (const value of ['2026-02-30', '../session', '2026-13-01', '2026-1-01'])
    expect(isReflectionDayKey(value)).toBe(false)
})
