import { expect, it } from 'vitest'
import type { RewindInsights } from '@/shared/api/rewind.api'
import { parseFlexxDesign, starterFlexxDesigns } from './flexx-design'
import { meaningfulFlexxDesigns } from './flexx-feed-content'

const empty = {
  totalGoals: 0,
  totalCheckIns: 0,
  currentStreak: 0,
  longestStreak: 0,
  completionRate: 0,
  averageProgress: 0,
}
const base = starterFlexxDesigns('daily', 0)[0]
if (!base) throw new Error('Missing Flexx fixture')
const question = parseFlexxDesign({
  ...base,
  id: 'collection:questions:0',
  category: 'rewind',
  layout: 'questionnaire',
  blocks: [],
  editorial: null,
  questionnaire: {
    question: 'What tiny moment would you keep?',
    options: ['A quiet break', 'A good laugh', 'Still looking'],
  },
})

it('keeps answerable questions but removes zero stat and empty achievement posters', () => {
  const designs = [
    ...starterFlexxDesigns('daily', 0),
    ...starterFlexxDesigns('achievement', 0),
    question,
  ]
  expect(meaningfulFlexxDesigns(designs, empty, undefined, false)).toEqual([
    question,
  ])
})

it('drops a zero hero rather than replacing it with an invented positive stat', () => {
  const design = parseFlexxDesign({
    ...base,
    blocks: [
      { slot: 'hero', metric: 'currentStreak' },
      { slot: 'aside', metric: 'totalGoals' },
    ],
  })
  expect(
    meaningfulFlexxDesigns(
      [design],
      { ...empty, totalGoals: 4 },
      undefined,
      true,
    ),
  ).toEqual([])
})

it('keeps real positive heroes, prunes empty supporting metrics and preserves IDs and metadata', () => {
  const design = parseFlexxDesign({
    ...base,
    blocks: [
      { slot: 'hero', metric: 'totalCheckIns' },
      { slot: 'aside', metric: 'completionRate' },
      { slot: 'bottomLeft', metric: 'currentStreak' },
    ],
  })
  const original = structuredClone(design)
  const result = meaningfulFlexxDesigns(
    [design],
    { ...empty, totalCheckIns: 12 },
    undefined,
    true,
  )
  expect(result).toEqual([
    { ...design, blocks: [{ slot: 'hero', metric: 'totalCheckIns' }] },
  ])
  expect(design).toEqual(original)
})

it.each([0, -1, NaN, Infinity, 0.1, 0.49])(
  'never displays a percentage hero that is invalid or rounds to zero: %s',
  (completionRate) => {
    const design = parseFlexxDesign({
      ...base,
      layout: 'ring',
      blocks: [{ slot: 'hero', metric: 'completionRate' }],
    })
    expect(
      meaningfulFlexxDesigns(
        [design],
        { ...empty, completionRate },
        undefined,
        true,
      ),
    ).toEqual([])
  },
)

it('preserves pending/error section placeholders and does not gate questions on stats', () => {
  const designs = starterFlexxDesigns('all', 4)
  expect(
    meaningfulFlexxDesigns(designs, undefined, undefined, undefined),
  ).toEqual(designs)
  expect(
    meaningfulFlexxDesigns([question], undefined, undefined, false),
  ).toEqual([question])
})

it('removes empty Rewind stats but keeps real completed sessions without inventing consistency', () => {
  const rewind: RewindInsights = {
    range: '7d',
    coverage: { completedDays: 0, completedSessions: 0, days: 7 },
    hasSufficientData: false,
    signals: null,
    deltas: null,
    progress: null,
    contextualInsight: null,
  }
  const design = parseFlexxDesign({
    ...base,
    category: 'rewind',
    symbol: 'rewind',
    blocks: [
      { slot: 'hero', metric: 'rewindSessions' },
      { slot: 'aside', metric: 'rewindConsistency' },
    ],
  })
  expect(
    meaningfulFlexxDesigns([design, question], empty, rewind, false),
  ).toEqual([question])
  expect(
    meaningfulFlexxDesigns(
      [design],
      empty,
      { ...rewind, coverage: { ...rewind.coverage, completedSessions: 2 } },
      false,
    ),
  ).toEqual([
    { ...design, blocks: [{ slot: 'hero', metric: 'rewindSessions' }] },
  ])
})
