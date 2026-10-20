import { existsSync, readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
import { achievementBadgeAsset } from './achievement-badges'

it('covers every server-defined achievement without changing persisted emoji contracts', () => {
  const config = readFileSync('../cloud/src/config/badges.config.ts', 'utf8')
  const definitions = [
    ...config.matchAll(/type: "([^"]+)",\s+milestone: (\d+)/g),
  ]
  expect(definitions).toHaveLength(19)
  for (const definition of definitions) {
    const asset = achievementBadgeAsset(definition[1], Number(definition[2]))
    expect(asset).not.toContain('signature')
    expect(existsSync(`public${asset}`)).toBe(true)
  }
  expect(existsSync(`public${achievementBadgeAsset('unknown', 9)}`)).toBe(true)
})
