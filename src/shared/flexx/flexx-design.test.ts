import { expect, it } from 'vitest'
import {
  compositionKey,
  FLEXX_CATEGORIES,
  FLEXX_THEMES,
  interleaveFlexxQuestions,
  metricValue,
  parseFlexxDesign,
  parseFlexxPage,
  starterFlexxDesigns,
} from './flexx-design'

it('creates varied starter maps with stable seeds and correct category bindings', () => {
  for (const category of ['all', ...FLEXX_CATEGORIES] as const) {
    const designs = starterFlexxDesigns(category, 7)
    expect(designs).toHaveLength(10)
    expect(designs).toEqual(starterFlexxDesigns(category, 7))
    expect(
      new Set(designs.map((design) => design.palette)).size,
    ).toBeGreaterThanOrEqual(3)
    if (category !== 'all')
      expect(designs.every((design) => design.category === category)).toBe(true)
    expect(designs.every((design) => parseFlexxDesign(design))).toBe(true)
    expect(
      designs.every(
        (design) => design.questionnaire || design.editorial?.text.length,
      ),
    ).toBe(true)
  }
  expect(
    starterFlexxDesigns('all', 0)
      .slice(0, 5)
      .map((design) => design.category),
  ).toEqual([...FLEXX_CATEGORIES])
  expect(starterFlexxDesigns('all', 0)).not.toEqual(
    starterFlexxDesigns('all', 1),
  )
})

it('spreads persisted question posts through each batch without mutating it', () => {
  const questionTexts = [
    'What felt most present today?',
    'What small moment do you want to remember?',
    'What would make tomorrow feel kinder?',
    'What did you need more of today?',
  ]
  const questions = starterFlexxDesigns('rewind', 0)
    .slice(0, 4)
    .map((design, index) => {
      const question = questionTexts[index]
      if (!question) throw new Error('Missing Flexx question fixture')
      return parseFlexxDesign({
        ...design,
        id: `question:${index}`,
        layout: 'questionnaire',
        blocks: [],
        editorial: null,
        questionnaire: {
          question,
          options: ['I felt grounded', 'I need a little space', 'Not sure yet'],
        },
      })
    })
  const otherDesigns = starterFlexxDesigns('all', 7)
    .filter((design) => !design.questionnaire)
    .slice(0, 6)
  const batch = [...questions, ...otherDesigns]
  const original = [...batch]
  const ordered = interleaveFlexxQuestions(batch)

  expect(ordered).toHaveLength(batch.length)
  expect(
    ordered.filter((design) => design.questionnaire).map((design) => design.id),
  ).toEqual(questions.map((design) => design.id))
  expect(
    ordered.flatMap((design, index) => (design.questionnaire ? [index] : [])),
  ).toEqual([2, 4, 6, 8])
  expect(batch).toEqual(original)
})

it('does not accept arbitrary CSS, HTML, metrics or numeric claims from the model', () => {
  const base = starterFlexxDesigns('daily', 0)[0]
  for (const value of [
    { ...base, headline: '<script>alert(1)</script>' },
    { ...base, palette: 'url(https://bad.test)' },
    { ...base, headline: 'Completed 999 goals' },
    { ...base, author: { kind: 'partner', partnerId: 'stranger' } },
    { ...base, author: { kind: 'group', partnerId: null } },
    { ...base, author: { kind: 'self', partnerId: 'ella' } },
    { ...base, author: { partnerIds: [] } },
    { ...base, author: { partnerIds: ['ella', 'ella'] } },
    { ...base, likedBy: ['you'] },
    { ...base, likedBy: ['ella', 'ella'] },
    {
      ...base,
      questionnaire: {
        question: 'How is today feeling?',
        options: ['Fine', 'Fine'],
      },
    },
    { ...base, blocks: [{ slot: 'hero', metric: 'fakePoints' }] },
    { ...base, blocks: [{ slot: 'hero', metric: 'rewindSessions' }] },
    {
      ...base,
      layout: 'ring',
      blocks: [{ slot: 'hero', metric: 'totalCheckIns' }],
    },
    {
      ...base,
      blocks: [
        { slot: 'hero', metric: 'totalCheckIns' },
        { slot: 'hero', metric: 'totalGoals' },
      ],
    },
  ])
    expect(() => parseFlexxDesign(value)).toThrow()
})

it('validates page versions, IDs, counts and cursor shape', () => {
  const page = {
    version: 1,
    source: 'ai',
    designs: starterFlexxDesigns('all', 1),
    nextCursor: 'next',
  }
  expect(parseFlexxPage(page).designs).toHaveLength(10)
  expect(
    parseFlexxPage({ ...page, designs: [], nextCursor: null }).designs,
  ).toEqual([])
  expect(() => parseFlexxPage({ ...page, version: 2 })).toThrow()
  expect(() => parseFlexxPage({ ...page, nextCursor: 123 })).toThrow()
  expect(() =>
    parseFlexxPage({ ...page, designs: [page.designs[0], page.designs[0]] }),
  ).toThrow()
})

it('keeps old saved slides readable while validating new editorial copy', () => {
  const base = starterFlexxDesigns('daily', 0)[0]
  if (!base) throw new Error('Missing Flexx design fixture')
  const { editorial: _editorial, ...oldDesign } = base

  expect(parseFlexxDesign(oldDesign).editorial).toBeNull()
  expect(() =>
    parseFlexxDesign({
      ...base,
      editorial: { kind: 'micro-action', text: 'https://example.com' },
    }),
  ).toThrow()
  expect(() =>
    parseFlexxDesign({
      ...base,
      editorial: { kind: 'unknown', text: 'Take a small step today.' },
    }),
  ).toThrow()
})

it('normalizes old self authors and near-white palettes to partner-only dark posters', () => {
  const base = starterFlexxDesigns('daily', 0)[0]
  const parsed = parseFlexxDesign({
    ...base,
    author: { kind: 'self', partnerId: null },
    palette: 'paper',
    simulatedLikes: 9000,
  })
  expect(parsed.author).toEqual({ partnerIds: ['ella'] })
  expect(parsed.palette).toBe('slate')
  expect('simulatedLikes' in parsed).toBe(false)
  for (const theme of Object.values(FLEXX_THEMES))
    expect(theme.background).not.toMatch(/^#(?:fff|f5f5f5|ffffff)$/i)
})

it('binds real values at render time and deduplicates maps rather than server IDs', () => {
  const stats = {
    totalGoals: 3,
    totalCheckIns: 42,
    currentStreak: 8,
    longestStreak: 9,
    completionRate: 87.6,
    averageProgress: 66,
  }
  expect(metricValue('totalCheckIns', stats).formatted).toBe('42')
  expect(metricValue('completionRate', stats).formatted).toBe('88%')
  expect(metricValue('rewindSessions', stats).value).toBe(0)
  const original = starterFlexxDesigns('all', 1)[0]
  if (!original) throw new Error('Missing design')
  expect(compositionKey(original)).toBe(
    compositionKey({ ...original, id: 'different-id' }),
  )
  expect(compositionKey(original)).not.toBe(
    compositionKey({
      ...original,
      editorial: { kind: 'reflection', text: 'Notice what helped today.' },
    }),
  )
})

it('uses opaque brand colors with readable primary text contrast', () => {
  const luminance = (hex: string): number => {
    const channels = [1, 3, 5]
      .map((start) => Number(`0x${hex.slice(start, start + 2)}`) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      )
    return (
      (channels[0] ?? 0) * 0.2126 +
      (channels[1] ?? 0) * 0.7152 +
      (channels[2] ?? 0) * 0.0722
    )
  }
  for (const theme of Object.values(FLEXX_THEMES)) {
    const foreground = luminance(theme.foreground)
    const background = luminance(theme.background)
    expect(
      (Math.max(foreground, background) + 0.05) /
        (Math.min(foreground, background) + 0.05),
    ).toBeGreaterThanOrEqual(4.5)
  }
})
