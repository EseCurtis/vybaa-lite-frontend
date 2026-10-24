// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { isValidElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  defaultHomeActionPreferences,
  HOME_ACTION_IDS,
  saveHomeActionPreferences,
} from '@/shared/home/home-action-preferences'
import { featureFlags } from '@/shared/config/feature-flags.config'
import { HomeActions, homeActions } from './home-actions.component'

const controls = vi.hoisted(() => ({
  owner: 'owner',
  navigate: vi.fn(),
  present: vi.fn(),
  dismiss: vi.fn(),
}))
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => controls.navigate,
}))
vi.mock('@/providers/auth.provider', () => ({
  useAuth: () => ({
    user: {
      id: controls.owner,
      username: controls.owner,
      email: 'owner@example.test',
      rewindPersona: 'ella',
    },
  }),
}))
vi.mock('@/hooks/use-bottom-sheet.hook', () => ({
  useBottomSheet: () => controls,
}))
vi.mock('./home-rewind-timer.component', () => ({
  HomeRewindTimer: () => <span>02:00:00</span>,
}))
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  controls.owner = 'owner'
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function openEditor() {
  fireEvent.click(
    screen.getByRole('button', { name: 'Customize Home shortcuts' }),
  )
  const [sheet] = controls.present.mock.lastCall ?? []
  if (!isValidElement(sheet)) throw new Error('Home sheet was not opened')
  return render(<div role="dialog">{sheet}</div>)
}

it('preserves default actions, partner naming, routes and disabled feature flags', () => {
  const tasks = vi.fn()
  const actions = homeActions(controls.navigate, tasks, 'neeja')
  expect(actions.map((action) => action.id)).toEqual([
    'flexx',
    'tasks',
    'rewind',
    'wellbeing',
    ...HOME_ACTION_IDS.slice(5),
  ])
  expect(featureFlags.chill).toBe(false)
  expect(actions.find((action) => action.id === 'rewind')?.name).toBe(
    'Rewind w/ neeja',
  )
  actions.find((action) => action.id === 'tasks')?.onAction()
  actions.find((action) => action.id === 'wellbeing')?.onAction()
  expect(tasks).toHaveBeenCalledOnce()
  expect(controls.navigate).toHaveBeenCalledWith({ to: '/app/rewind-history' })
})

it('preserves the seeded gradient fill and masked border on every Home action', () => {
  render(<HomeActions />)
  for (const button of screen.getAllByTestId(/^home-action-/)) {
    expect(button.parentElement?.style.getPropertyValue('--color')).toBeTruthy()
    expect(button.querySelector('[style*="radial-gradient"]')).toBeTruthy()
    expect(
      button.querySelector('[style*="linear-gradient(to left"]'),
    ).toBeTruthy()
    expect(
      button.querySelector('[style*="linear-gradient(to bottom"]'),
    ).toBeTruthy()
  }
})

it('lets users hide and reorder shortcuts, persists them and keeps Customize available', () => {
  render(<HomeActions />)
  const sheet = openEditor()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show Flexx' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Move Rewind w/ ella earlier' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save shortcuts' }))
  expect(screen.queryByTestId('home-action-flexx')).toBeNull()
  expect(
    screen.getAllByTestId(/^home-action-/).map((item) => item.dataset.testid),
  ).toEqual([
    'home-action-rewind',
    'home-action-my-tasks',
    'home-action-wellbeing',
    ...HOME_ACTION_IDS.slice(5).map((id) => `home-action-${id}`),
  ])
  expect(controls.dismiss).toHaveBeenCalledOnce()
  sheet.unmount()
  expect(document.activeElement).toBe(
    screen.getByRole('button', { name: 'Customize Home shortcuts' }),
  )
  fireEvent.click(screen.getByTestId('home-action-my-tasks'))
  expect(controls.navigate).toHaveBeenCalledWith({ to: '/app/goal' })
})

it('keeps failed drafts editable for retry and does not expose raw storage errors', () => {
  render(<HomeActions />)
  openEditor()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show Flexx' }))
  const blocked = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('private storage error')
    })
  fireEvent.click(screen.getByRole('button', { name: 'Save shortcuts' }))
  expect(screen.getByRole('alert').textContent).toContain(
    'Your changes are kept here',
  )
  expect(screen.queryByText('private storage error')).toBeNull()
  expect(controls.dismiss).not.toHaveBeenCalled()
  blocked.mockRestore()
  fireEvent.click(screen.getByRole('button', { name: 'Save shortcuts' }))
  expect(screen.queryByTestId('home-action-flexx')).toBeNull()
})

it('handles account changes and all-hidden preferences without trapping the user', () => {
  saveHomeActionPreferences('owner', {
    ...defaultHomeActionPreferences(),
    hidden: [...HOME_ACTION_IDS],
  })
  const view = render(<HomeActions />)
  expect(screen.queryAllByTestId(/^home-action-/)).toHaveLength(0)
  expect(
    screen.getByRole('button', { name: 'Customize Home shortcuts' }),
  ).toBeTruthy()
  controls.owner = 'another-owner'
  view.rerender(<HomeActions />)
  expect(screen.getAllByTestId(/^home-action-/)).toHaveLength(12)
  act(() =>
    saveHomeActionPreferences('another-owner', {
      ...defaultHomeActionPreferences(),
      hidden: ['rewind'],
    }),
  )
  expect(screen.queryByTestId('home-action-rewind')).toBeNull()
  const editor = openEditor()
  expect(
    within(editor.container).queryByRole('checkbox', { name: 'Show Chill' }),
  ).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Restore defaults' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save shortcuts' }))
  expect(screen.getAllByTestId(/^home-action-/)).toHaveLength(12)
})

it('routes every new shortcut to its existing screen and retains the Journal feature flag', () => {
  const actions = homeActions(controls.navigate)
  const routes = [
    ['journal', '/app/journal'],
    ['chats', '/app/rewind-chats'],
    ['rewards', '/app/rewards'],
    ['achievements', '/achievements'],
    ['about-you', '/app/onboarding/about-you'],
    ['social-studio', '/app/social'],
    ['settings', '/app/sub-profile/settings'],
  ] as const
  for (const [id, to] of routes) {
    actions.find((action) => action.id === id)?.onAction()
    expect(controls.navigate).toHaveBeenLastCalledWith({ to })
  }
  actions.find((action) => action.id === 'rewind-schedule')?.onAction()
  expect(controls.navigate).toHaveBeenLastCalledWith({
    to: '/app/rewind-routine',
    search: { from: 'rewind' },
  })
  const enabled = featureFlags.journal
  try {
    featureFlags.journal = false
    expect(homeActions().some((action) => action.id === 'journal')).toBe(false)
  } finally {
    featureFlags.journal = enabled
  }
})

it('lets users hide and reorder the new shortcuts with the same saved preferences', () => {
  render(<HomeActions />)
  openEditor()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Show Social Studio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Move Journal earlier' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save shortcuts' }))
  expect(screen.queryByTestId('home-action-social-studio')).toBeNull()
  expect(
    screen
      .getAllByTestId(/^home-action-/)
      .map((item) => item.dataset.testid)
      .slice(0, 5),
  ).toEqual([
    'home-action-flexx',
    'home-action-my-tasks',
    'home-action-rewind',
    'home-action-journal',
    'home-action-wellbeing',
  ])
})
