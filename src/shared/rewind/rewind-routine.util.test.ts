import { describe, expect, it } from 'vitest'

import { getCustomRewindTimeError } from './rewind-routine.util'

describe('getCustomRewindTimeError', () => {
  it('accepts custom times that are eight hours apart across midnight', () => {
    expect(getCustomRewindTimeError(['21:00', '06:00'])).toBeNull()
  })

  it('rejects times that leave less than eight hours in either direction', () => {
    expect(getCustomRewindTimeError(['08:00', '15:00'])).toMatch(/eight hours/i)
    expect(getCustomRewindTimeError(['22:00', '05:00'])).toMatch(/eight hours/i)
  })

  it('requires two distinct valid local times', () => {
    expect(getCustomRewindTimeError(['08:00', '08:00'])).toMatch(/different/i)
    expect(getCustomRewindTimeError(['25:00', '12:00'])).toMatch(/different/i)
  })
})
