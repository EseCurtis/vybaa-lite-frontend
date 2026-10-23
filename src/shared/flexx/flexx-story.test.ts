import { expect, it } from 'vitest'
import { starterFlexxDesigns } from './flexx-design'
import { flexxStory } from './flexx-story'

const empty = {
  totalGoals: 0,
  totalCheckIns: 0,
  currentStreak: 0,
  longestStreak: 0,
  completionRate: 0,
  averageProgress: 0,
}
const designs = Array.from({ length: 60 }, (_, index) => ({
  ...starterFlexxDesigns('daily', 2)[0],
  id: `story:${index}`,
}))

it('does not manufacture facts for new users, invalid data or missing Rewind data', () => {
  for (const design of designs) {
    expect(flexxStory(design, empty)).toBeNull()
    expect(
      flexxStory(design, { ...empty, totalCheckIns: NaN, currentStreak: -4 }),
    ).toBeNull()
    expect(
      flexxStory(
        { ...design, category: 'rewind' },
        { ...empty, totalCheckIns: 100 },
      ),
    ).toBeNull()
  }
})

it('binds real viewer values, varies copy, and keeps some metric-led posts', () => {
  const stats = {
    ...empty,
    totalCheckIns: 17,
    currentStreak: 3,
    longestStreak: 9,
    totalGoals: 4,
  }
  const stories = designs.map((design) => flexxStory(design, stats))
  expect(stories.some((story) => story === null)).toBe(true)
  expect(
    new Set(stories.flatMap((story) => (story ? [story.title] : []))).size,
  ).toBeGreaterThan(3)
  for (const design of designs)
    expect(flexxStory(design, stats)).toEqual(flexxStory(design, stats))
  const onlyCheckins = designs.flatMap(
    (design) => flexxStory(design, { ...empty, totalCheckIns: 17 }) ?? [],
  )
  expect(
    onlyCheckins.every((story) => story.text.includes('17 check-ins')),
  ).toBe(true)
})

it('never replaces achievements or questionnaires', () => {
  const stats = { ...empty, totalCheckIns: 100 }
  for (const design of designs) {
    expect(flexxStory({ ...design, category: 'achievement' }, stats)).toBeNull()
    expect(
      flexxStory(
        {
          ...design,
          questionnaire: {
            question: 'What felt good today?',
            options: ['Rest', 'Making things'],
          },
        },
        stats,
      ),
    ).toBeNull()
  }
})
