import { describe, expect, it } from 'vitest'

import { canChangeRewindPartner } from './rewind-partner-switch.util'

describe('canChangeRewindPartner', () => {
  it('allows a first selection and an elapsed daily cooldown', () => {
    const now = new Date('2026-09-05T23:00:00.000Z')

    expect(canChangeRewindPartner(undefined, now)).toBe(true)
    expect(canChangeRewindPartner('2026-09-05T22:59:59.000Z', now)).toBe(true)
  })

  it('blocks another switch before the next local day starts', () => {
    expect(
      canChangeRewindPartner(
        '2026-09-05T23:00:00.000Z',
        new Date('2026-09-05T22:59:59.000Z'),
      ),
    ).toBe(false)
  })
})
