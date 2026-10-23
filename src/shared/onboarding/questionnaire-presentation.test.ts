import { expect, it } from 'vitest'

import { questionnaireFixture } from './questionnaire.test-fixture'
import {
  questionnaireDecoration,
  questionnairePresentation,
} from './questionnaire-presentation'
import {
  PARTNER_EMOTIONS,
  partnerEmojiAsset,
} from '@/shared/rewind/partner-emojis'
import { existsSync } from 'node:fs'

const IDS = [
  'priorities',
  'day-shape',
  'energy',
  'planning',
  'starting',
  'obstacles',
  'stress',
  'recharge',
  'change',
  'support',
  'accountability',
  'reflection',
  'boundaries',
]

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const channel = Number(`0x${hex.slice(start, start + 2)}`) / 255
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return (
    (channels[0] ?? 0) * 0.2126 +
    (channels[1] ?? 0) * 0.7152 +
    (channels[2] ?? 0) * 0.0722
  )
}

it('gives all thirteen slides distinct opaque colours with readable bubble text and existing artwork', () => {
  const base = questionnaireFixture.questions[0]
  if (!base) throw new Error('Missing fixture')
  const styles = IDS.map((id) =>
    questionnairePresentation({ ...base, id }, false),
  )
  expect(new Set(styles.map((style) => style.accent)).size).toBe(13)
  expect(new Set(styles.map((style) => style.surface)).size).toBe(13)
  for (const style of styles) {
    expect(style.surface).toMatch(/^#[0-9A-F]{6}$/)
    expect(
      (luminance(style.accent) + 0.05) / (luminance(style.surface) + 0.05),
    ).toBeGreaterThanOrEqual(4.5)
    expect(PARTNER_EMOTIONS).toContain(style.emotion)
    expect(existsSync(`public${partnerEmojiAsset(style)}`)).toBe(true)
  }
})

it('keeps seeded arrangements stable and provides a fallback for new server questions', () => {
  expect(questionnaireDecoration('owner:support')).toEqual(
    questionnaireDecoration('owner:support'),
  )
  expect(questionnaireDecoration('owner:support')).not.toEqual(
    questionnaireDecoration('owner:energy'),
  )
  const base = questionnaireFixture.questions[0]
  if (!base) throw new Error('Missing fixture')
  expect(
    questionnairePresentation({ ...base, id: 'future-question' }, false)
      .message,
  ).toBe(base.hint)
  expect(questionnairePresentation(undefined, true).emotion).toBe('cheering')
})
