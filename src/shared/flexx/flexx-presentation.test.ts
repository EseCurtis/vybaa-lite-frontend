import { expect, it, vi } from 'vitest'

import { starterFlexxDesigns } from './flexx-design'
import { flexxPresentation } from './flexx-presentation'
import {
  REWIND_EXPRESSIONS,
  rewindExpressionAsset,
} from '@/shared/rewind/rewind-expressions'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'

it('selects stable visual treatments without replacing seeded content or consuming randomness', () => {
  const designs = starterFlexxDesigns('all', 29)
  const original = structuredClone(designs)
  const random = vi.spyOn(Math, 'random')
  for (const design of designs)
    expect(flexxPresentation(design)).toEqual(flexxPresentation({ ...design }))
  expect(designs).toEqual(original)
  expect(random).not.toHaveBeenCalled()
  random.mockRestore()
})

it('varies text, numbers and symbols while leaving some slides still', () => {
  const design = starterFlexxDesigns('daily', 0)[0]
  const treatments = Array.from({ length: 80 }, (_, index) =>
    flexxPresentation({ ...design, id: `variation:${index}` }),
  )
  expect(new Set(treatments.map((entry) => entry.loop))).toEqual(
    new Set(['symbol', 'metric', 'headline', 'none']),
  )
  expect(treatments.some((entry) => entry.expression === null)).toBe(true)
  expect(treatments.some((entry) => entry.expression !== null)).toBe(true)
})

it('never places portraits into dense grids or over percentage rings', () => {
  const design = starterFlexxDesigns('weekly', 0)[0]
  for (const layout of ['split', 'ledger', 'ring'] as const)
    for (let index = 0; index < 20; index++)
      expect(
        flexxPresentation({ ...design, id: String(index), layout }).expression,
      ).toBeNull()
})

it('keeps questionnaire wording still and reserves only a thinking or listening portrait', () => {
  const design = starterFlexxDesigns('rewind', 0)[0]
  for (let index = 0; index < 10; index++) {
    const presentation = flexxPresentation({
      ...design,
      id: String(index),
      layout: 'questionnaire',
      blocks: [],
      questionnaire: {
        question: 'How did today feel?',
        options: ['Quiet', 'Busy'],
      },
    })
    expect(presentation.loop).toBe('none')
    expect(['thinking', 'listening']).toContain(presentation.expression)
  }
})

it('maps all six existing identities and eight expressions to versioned local WebP assets', () => {
  const assets = REWIND_PERSONAS.flatMap((partner) =>
    REWIND_EXPRESSIONS.map((expression) =>
      rewindExpressionAsset(partner.id, expression),
    ),
  )
  expect(assets).toHaveLength(48)
  expect(new Set(assets).size).toBe(48)
  expect(
    assets.every((asset) =>
      /^\/assets\/rewind\/expressions\/v1\/[a-z]+\/[a-z]+\.webp$/.test(asset),
    ),
  ).toBe(true)
})
