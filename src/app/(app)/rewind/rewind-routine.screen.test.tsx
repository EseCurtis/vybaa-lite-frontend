// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { RewindRoutineOverview } from '@/shared/api/rewind.api'
import RewindRoutineScreen from './rewind-routine.screen'

const state = vi.hoisted(() => ({
  data: undefined as RewindRoutineOverview | undefined,
  mutateAsync: vi.fn(),
  navigate: vi.fn(),
  requestProAccess: vi.fn(),
  isSupported: true,
  isPro: false,
  toast: { success: vi.fn(), error: vi.fn() },
}))
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => state.navigate }))
vi.mock('@/components/common/tab-header.component', () => ({
  TabHeader: () => <header>Rewind routine</header>,
}))
vi.mock('@/components/common/noise.component', () => ({
  NoiseComponent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}))
vi.mock('@/hooks/use-rewind.hook', () => ({
  useRewindRoutine: () => ({ data: state.data }),
  useUpdateRewindRoutine: () => ({
    mutateAsync: state.mutateAsync,
    isPending: false,
  }),
}))
vi.mock('@/hooks/use-pro-access.hook', () => ({
  useProAccess: () => ({
    requestProAccess: state.requestProAccess,
    handleSubscriptionError: vi.fn(),
  }),
}))
vi.mock('@/providers/subscription.provider', () => ({
  useSubscription: () => ({
    isPro: state.isPro,
    isSupported: state.isSupported,
  }),
}))
vi.mock('@/providers/toast.provider', () => ({ useToast: () => state.toast }))
vi.mock('@/shared/api/http', () => ({
  getDeviceTimezone: () => 'Africa/Lagos',
}))
vi.mock('@/shared/utils/animation.util', () => ({ shouldAnimate: false }))

beforeEach(() => {
  vi.clearAllMocks()
  state.data = undefined
  state.isSupported = true
  state.isPro = false
  state.mutateAsync.mockResolvedValue({})
})
afterEach(cleanup)

it('saves Flexible without times or an upgrade and returns to Rewind', async () => {
  render(<RewindRoutineScreen origin="rewind" />)
  const flexible = screen.getByRole('button', { name: 'Flexible, Anytime' })
  fireEvent.click(flexible)
  expect(flexible.getAttribute('aria-pressed')).toBe('true')
  expect(screen.queryByText('Each Rewind stays open for one hour.')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Save routine' }))
  await waitFor(() =>
    expect(state.mutateAsync).toHaveBeenCalledWith({
      frequency: 'FLEXIBLE',
      intent: 'UNDERSTAND_EMOTIONS',
      customIntent: null,
      times: undefined,
      timezone: 'Africa/Lagos',
    }),
  )
  expect(state.requestProAccess).not.toHaveBeenCalled()
  expect(state.navigate).toHaveBeenCalledWith({
    replace: true,
    to: '/app/rewind',
  })
})

it('restores Flexible on devices without subscription support', async () => {
  state.isSupported = false
  state.data = {
    timezone: 'Africa/Lagos',
    currentSession: null,
    nextSession: null,
    latestSession: null,
    routine: {
      id: 'routine',
      frequency: 'FLEXIBLE',
      intent: 'SPOT_PATTERNS',
      times: [],
      customIntent: null,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    },
  }
  render(<RewindRoutineScreen origin="settings" />)
  expect(
    screen
      .getByRole('button', { name: 'Flexible, Anytime' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Save routine' }))
  await waitFor(() =>
    expect(state.navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/app/sub-profile/settings',
    }),
  )
  expect(state.mutateAsync.mock.calls[0][0].frequency).toBe('FLEXIBLE')
})

it('keeps custom times when selecting Flexible and switching back', () => {
  state.isPro = true
  state.data = {
    timezone: 'Africa/Lagos',
    currentSession: null,
    nextSession: null,
    latestSession: null,
    routine: {
      id: 'routine',
      frequency: 'CUSTOM',
      intent: 'SPOT_PATTERNS',
      times: ['06:30', '19:30'],
      customIntent: null,
      enabled: true,
      createdAt: '',
      updatedAt: '',
    },
  }
  const { container } = render(<RewindRoutineScreen origin="rewind" />)
  fireEvent.click(screen.getByRole('button', { name: 'Flexible, Anytime' }))
  expect(container.querySelectorAll('input[type="time"]').length).toBe(0)
  fireEvent.click(
    screen.getByRole('button', { name: 'Custom times, Choose 2 times' }),
  )
  const inputs = Array.from(
    container.querySelectorAll<HTMLInputElement>('input[type="time"]'),
  )
  expect(inputs.map((input) => input.value)).toEqual(['06:30', '19:30'])
})
