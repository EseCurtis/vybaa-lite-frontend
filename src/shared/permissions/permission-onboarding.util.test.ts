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
  hasSeenRewindPartnerOnboarding,
  markOnboardingSkipped,
  markPermissionOnboardingSeen,
  markRewindPartnerOnboardingSeen,
  shouldShowPermissionOnboarding,
  shouldShowRewindPartnerOnboarding,
} from './permission-onboarding.util'

describe('permission onboarding', () => {
  beforeEach(() => {
    localStorage.clear()
    mocks.isNativePlatform.mockReset().mockReturnValue(true)
  })

  it('shows permission education once per account when three permissions are missing', () => {
    expect(shouldShowPermissionOnboarding('user-one', 1)).toBe(true)
    expect(shouldShowPermissionOnboarding('user-two', 1)).toBe(true)

    markPermissionOnboardingSeen('user-one')

    expect(hasSeenPermissionOnboarding('user-one')).toBe(true)
    expect(hasSeenPermissionOnboarding('user-two')).toBe(false)
    expect(shouldShowPermissionOnboarding('user-one', 1)).toBe(false)
    expect(shouldShowPermissionOnboarding('user-two', 1)).toBe(true)
  })

  it('does not show permission education when two or more permissions are enabled', () => {
    expect(shouldShowPermissionOnboarding('user-one', 2)).toBe(false)
    expect(shouldShowPermissionOnboarding('user-one', 4)).toBe(false)
  })

  it('does not interrupt the web experience', () => {
    mocks.isNativePlatform.mockReturnValue(false)

    expect(shouldShowPermissionOnboarding('user-one', 0)).toBe(false)
  })

  it('shows partner selection only when no partner was chosen and the step is unseen', () => {
    expect(shouldShowRewindPartnerOnboarding('user-one', undefined)).toBe(true)
    expect(shouldShowRewindPartnerOnboarding('user-one', 'ella')).toBe(false)

    markRewindPartnerOnboardingSeen('user-one')

    expect(hasSeenRewindPartnerOnboarding('user-one')).toBe(true)
    expect(shouldShowRewindPartnerOnboarding('user-one', undefined)).toBe(false)
  })

  it('marks both onboarding steps seen when the flow is skipped', () => {
    markOnboardingSkipped('user-one')

    expect(hasSeenPermissionOnboarding('user-one')).toBe(true)
    expect(hasSeenRewindPartnerOnboarding('user-one')).toBe(true)
  })
})
