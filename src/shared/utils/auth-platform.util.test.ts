import { describe, expect, it } from 'vitest'

import {
  isAppleLoginAvailable,
  isGoogleLoginAvailable,
} from './auth-platform.util'

describe('isGoogleLoginAvailable', () => {
  it('offers Google login on Android', () => {
    expect(isGoogleLoginAvailable('android')).toBe(true)
  })

  it.each(['ios', 'web', 'unknown'])('hides Google login on %s', (platform) => {
    expect(isGoogleLoginAvailable(platform)).toBe(false)
  })
})

describe('isAppleLoginAvailable', () => {
  it('offers Apple login on iOS', () => {
    expect(isAppleLoginAvailable('ios')).toBe(true)
  })

  it.each(['android', 'web', 'unknown'])(
    'hides Apple login on %s',
    (platform) => {
      expect(isAppleLoginAvailable(platform)).toBe(false)
    },
  )
})
