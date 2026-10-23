// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import GoalsAppScreen from './index.screen'

const controls = vi.hoisted(() => ({
  back: vi.fn(),
  navigate: vi.fn(),
  canGoBack: true,
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => controls.navigate,
  useLocation: () => ({ pathname: '/app/goal' }),
  useRouter: () => ({
    navigate: controls.navigate,
    history: { back: controls.back, canGoBack: () => controls.canGoBack },
  }),
}))
vi.mock('@/hooks/use-goals.hook', () => ({
  useInfiniteGoals: () => ({
    data: { pages: [{ data: [] }] },
    isPending: false,
  }),
}))
vi.mock('@/components/custom/goal/create-goal-sheet.component', () => ({
  readGoalCreationDraft: () => null,
}))
vi.mock('@/components/custom/goal/task-list-row.component', () => ({
  TaskListRow: () => null,
}))
vi.mock('@/components/common/noise.component', () => ({
  NoiseComponent: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/shared/haptic.util', () => ({ hapticFeedback: { light: vi.fn() } }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  controls.canGoBack = true
})

it('adds the existing back header while retaining task search, filters and creation', () => {
  render(<GoalsAppScreen />)
  expect(screen.getByText('Tasks')).toBeTruthy()
  expect(screen.getByLabelText('Search tasks in this list')).toBeTruthy()
  expect(screen.getByRole('group', { name: 'Task lists' })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(controls.back).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Create a new task' }))
  expect(controls.navigate).toHaveBeenCalledWith({ to: '/app/goal/create' })
})

it('returns direct-entry visitors home when there is no back history', async () => {
  controls.canGoBack = false
  render(<GoalsAppScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }))
  expect(controls.navigate).toHaveBeenCalledWith({
    replace: true,
    to: '/app/home',
  })
})
