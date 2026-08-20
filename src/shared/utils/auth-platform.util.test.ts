import { describe, expect, it } from 'vitest'

import { isGoogleLoginAvailable } from './auth-platform.util'

describe('isGoogleLoginAvailable', () => {
  it('offers Google login on Android', () => {
    expect(isGoogleLoginAvailable('android')).toBe(true)
  })

  it.each(['ios', 'web', 'unknown'])('hides Google login on %s', (platform) => {
    expect(isGoogleLoginAvailable(platform)).toBe(false)
  })
})
