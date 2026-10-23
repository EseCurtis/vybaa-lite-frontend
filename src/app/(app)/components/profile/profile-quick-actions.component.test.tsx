// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { ProfileQuickActions } from './profile-quick-actions.component'
import type { ProfileQuickAction } from './profile.types'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('@tanstack/react-router', () => ({ useNavigate: () => navigate }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
const actions: ProfileQuickAction[] = [
  {
    group: 'personal',
    title: 'Journal',
    description: 'Your entries',
    to: '/app/journal',
    icon: <span />,
  },
  {
    group: 'progress',
    title: 'Play rewards',
    description: 'Play Points only',
    to: '/app/rewards',
    icon: <span />,
    colorScheme: { bg1: 'bg-accent-600', bg2: 'bg-accent-700' },
  },
  {
    group: 'preferences',
    title: 'Settings',
    description: 'App preferences',
    to: '/app/sub-profile/settings',
    icon: <span />,
  },
]

it('segments actions into named groups, retains walkthrough targeting and navigates to the same routes', () => {
  const view = render(<ProfileQuickActions actions={actions} />)
  expect(
    view.container.querySelector('[data-walkthrough="profile-quick-actions"]'),
  ).toBeTruthy()
  for (const group of ['Your space', 'Progress & rewards', 'App & connections'])
    expect(screen.getByRole('region', { name: group })).toBeTruthy()
  fireEvent.click(
    within(
      screen.getByRole('region', { name: 'Progress & rewards' }),
    ).getByRole('button'),
  )
  expect(navigate).toHaveBeenCalledWith({ to: '/app/rewards' })
  expect(screen.getAllByRole('button')).toHaveLength(3)
  const reward = within(
    screen.getByRole('region', { name: 'Progress & rewards' }),
  ).getByRole('button')
  expect(reward.classList.contains('bg-accent-600')).toBe(true)
  expect(reward.querySelector('.bg-accent-700')).toBeTruthy()
})

it('does not show empty groups and supports existing ungrouped callers', () => {
  const action = actions[0]
  if (!action) throw new Error('Missing action fixture')
  render(<ProfileQuickActions actions={[{ ...action, group: undefined }]} />)
  expect(screen.getByRole('region', { name: 'Your space' })).toBeTruthy()
  expect(
    screen.queryByRole('region', { name: 'Progress & rewards' }),
  ).toBeNull()
})
