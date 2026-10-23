// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { authAPI } from '@/shared/api/auth.api'
import { ApiError } from '@/shared/api/http'
import { onboardingAPI } from '@/shared/api/onboarding.api'
import { questionnaireFixture } from '@/shared/onboarding/questionnaire.test-fixture'
import UserOnboardingScreen from './user-onboarding.screen'

const controls = vi.hoisted(() => ({
  firstTime: true,
  refresh: vi.fn(),
  navigate: vi.fn(),
}))
const user = {
  id: 'owner',
  email: 'owner@example.test',
  username: 'owner',
  isFirstTime: false,
  isConfirmed: true,
  rewindPersona: 'ella' as const,
  createdAt: '2026-10-23T00:00:00Z',
  updatedAt: '2026-10-23T00:00:00Z',
}
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    user: { ...user, isFirstTime: controls.firstTime },
    refreshSession: controls.refresh,
  }),
}))
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: controls.navigate }),
}))

let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  controls.firstTime = true
  controls.navigate.mockResolvedValue(undefined)
  controls.refresh.mockResolvedValue(undefined)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  vi.spyOn(onboardingAPI, 'get').mockResolvedValue(questionnaireFixture)
  vi.spyOn(authAPI, 'completeOnboarding').mockResolvedValue({
    msg: 'saved',
    data: { user },
  })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})

function show() {
  render(
    <QueryClientProvider client={client}>
      <UserOnboardingScreen />
    </QueryClientProvider>,
  )
}

it('keeps failed answers editable and retries the same revision without exposing raw errors', async () => {
  vi.mocked(authAPI.completeOnboarding).mockRejectedValueOnce(
    new ApiError('database secret: private', { status: 500 }),
  )
  show()
  fireEvent.click(await screen.findByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Skip this question' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save my preferences' }))
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Couldn’t save your answers. Your draft is kept—check your connection and try again.',
  )
  expect(screen.getByText('Listening first')).toBeTruthy()
  expect(screen.queryByText(/database secret/)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Save my preferences' }))
  await waitFor(() =>
    expect(controls.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/app/home',
    }),
  )
  expect(authAPI.completeOnboarding).toHaveBeenCalledTimes(2)
  expect(vi.mocked(authAPI.completeOnboarding).mock.calls[0]).toEqual(
    vi.mocked(authAPI.completeOnboarding).mock.calls[1],
  )
  expect(controls.refresh).toHaveBeenCalledOnce()
})

it('saves an explicit skip with no answers rather than sharing the unfinished draft', async () => {
  show()
  await screen.findByRole('button', { name: 'Let’s do it' })
  fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
  await waitFor(() =>
    expect(authAPI.completeOnboarding).toHaveBeenCalledWith({
      answers: [],
      profile: { version: 1, revision: 0, skipped: true, answers: [] },
    }),
  )
})

it('lets an existing user close the editor without overwriting preferences', async () => {
  controls.firstTime = false
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  await waitFor(() =>
    expect(controls.navigate).toHaveBeenCalledWith({ to: '/app/profile' }),
  )
  expect(authAPI.completeOnboarding).not.toHaveBeenCalled()
})

it('does not block optional onboarding exit while its API is unavailable', async () => {
  vi.mocked(onboardingAPI.get).mockImplementation(() => new Promise(() => {}))
  show()
  fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
  await waitFor(() =>
    expect(controls.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/app/home',
    }),
  )
  expect(authAPI.completeOnboarding).not.toHaveBeenCalled()
})
