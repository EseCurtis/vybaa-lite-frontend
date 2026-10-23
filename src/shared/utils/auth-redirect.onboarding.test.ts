// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'
import { markQuestionnaireSeen } from '@/shared/onboarding/questionnaire.util'
import { getRequiredOnboardingRoute } from './auth-redirect.util'

const platform = vi.hoisted(() => ({ native: false }))
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => platform.native },
}))
vi.mock('@/shared/permissions/device-permission-state.util', () => ({
  countGrantedOnboardingPermissions: () => 0,
  readOnboardingPermissionStates: async () => ({}),
}))

beforeEach(() => {
  localStorage.clear()
  platform.native = false
})

it('offers the questionnaire once to a first-time account before other setup', async () => {
  const user = { id: 'owner', isFirstTime: true, rewindPersona: undefined }
  expect(await getRequiredOnboardingRoute(user)).toBe(
    '/app/onboarding/about-you',
  )
  markQuestionnaireSeen(user.id)
  expect(await getRequiredOnboardingRoute(user)).toBe(
    '/app/onboarding/rewind-partner',
  )
  expect(await getRequiredOnboardingRoute({ ...user, id: 'other' })).toBe(
    '/app/onboarding/about-you',
  )
})

it('does not replay onboarding for a completed account or an older client snapshot', async () => {
  expect(
    await getRequiredOnboardingRoute({
      id: 'owner',
      isFirstTime: false,
      rewindPersona: 'ella',
    }),
  ).toBeNull()
  expect(
    await getRequiredOnboardingRoute({ id: 'owner', rewindPersona: 'ella' }),
  ).toBeNull()
})

it('retains native permission onboarding after the questionnaire is skipped or saved', async () => {
  platform.native = true
  markQuestionnaireSeen('owner')
  expect(
    await getRequiredOnboardingRoute({
      id: 'owner',
      isFirstTime: true,
      rewindPersona: undefined,
    }),
  ).toBe('/app/permissions')
})
