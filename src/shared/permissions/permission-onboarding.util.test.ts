// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn<() => boolean>(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

import {
  hasSeenPermissionOnboarding,
  markPermissionOnboardingSeen,
  shouldShowPermissionOnboarding,
} from './permission-onboarding.util'

describe('permission onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.isNativePlatform.mockReset().mockReturnValue(true)
  })

  it('shows once on a native installation', () => {
    expect(shouldShowPermissionOnboarding()).toBe(true)

    markPermissionOnboardingSeen()

    expect(hasSeenPermissionOnboarding()).toBe(true)
    expect(shouldShowPermissionOnboarding()).toBe(false)
  })

  it('does not interrupt the web experience', () => {
    mocks.isNativePlatform.mockReturnValue(false)

    expect(shouldShowPermissionOnboarding()).toBe(false)
  })
})
