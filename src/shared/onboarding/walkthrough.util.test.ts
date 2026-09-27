// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'

import {
  getWalkthroughStorageKey,
  hasCompletedWalkthrough,
  markWalkthroughCompleted,
} from './walkthrough.util'

describe('walkthrough persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores completion separately for each account and walkthrough', () => {
    markWalkthroughCompleted('home', 'user-one')

    expect(hasCompletedWalkthrough('home', 'user-one')).toBe(true)
    expect(hasCompletedWalkthrough('goals', 'user-one')).toBe(false)
    expect(hasCompletedWalkthrough('home', 'user-two')).toBe(false)
  })

  it('uses a versioned storage key', () => {
    expect(getWalkthroughStorageKey('rewind', 'user-one')).toBe(
      'vybaa:walkthrough:v1:rewind:user-one',
    )
  })
})
