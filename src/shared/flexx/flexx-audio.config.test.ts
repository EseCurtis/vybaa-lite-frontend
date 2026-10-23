import { expect, it } from 'vitest'

import { chooseFlexxSoundtrack, FLEXX_SOUNDTRACKS } from './flexx-audio.config'

it('randomly selects a configured track without repeating the previous slide track', () => {
  const first = chooseFlexxSoundtrack(null, () => 0.99)
  const next = chooseFlexxSoundtrack(first.id, () => 0.99)

  expect(FLEXX_SOUNDTRACKS).toHaveLength(2)
  expect(first.id).toBe('bright-little-steps')
  expect(next.id).toBe('curious-pulse')
  expect(next.id).not.toBe(first.id)
})
