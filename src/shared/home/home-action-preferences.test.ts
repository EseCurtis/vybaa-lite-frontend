// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  defaultHomeActionPreferences,
  HOME_ACTION_IDS,
  HOME_ACTIONS_CHANGED,
  moveHomeAction,
  parseHomeActionPreferences,
  readHomeActionSnapshot,
  saveHomeActionPreferences,
} from './home-action-preferences'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

it('keeps the existing order by default and safely rejects corrupt or future data', () => {
  for (const raw of [
    null,
    'broken json',
    'null',
    '{}',
    JSON.stringify({ version: 2, order: ['rewind'], hidden: [] }),
  ]) {
    expect(parseHomeActionPreferences(raw)).toEqual(
      defaultHomeActionPreferences(),
    )
  }
  expect(defaultHomeActionPreferences().order).toEqual(HOME_ACTION_IDS)
})

it('deduplicates known IDs and appends missing actions without trusting arbitrary stored values', () => {
  expect(
    parseHomeActionPreferences(
      JSON.stringify({
        version: 1,
        order: ['rewind', 'rewind', 'invented', null],
        hidden: ['tasks', 'invented', 'tasks'],
      }),
    ),
  ).toEqual({
    version: 1,
    order: ['rewind', 'flexx', 'tasks', 'wellbeing', 'chill'],
    hidden: ['tasks'],
  })
})

it('saves per account and notifies the current page immediately', () => {
  const listener = vi.fn()
  window.addEventListener(HOME_ACTIONS_CHANGED, listener, { once: true })
  const preferences = {
    ...defaultHomeActionPreferences(),
    hidden: [...HOME_ACTION_IDS],
  }
  saveHomeActionPreferences('owner', preferences)
  expect(parseHomeActionPreferences(readHomeActionSnapshot('owner'))).toEqual(
    preferences,
  )
  expect(readHomeActionSnapshot('someone-else')).toBeNull()
  expect(listener).toHaveBeenCalledOnce()
})

it('moves available rows without dropping disabled features or mutating the original', () => {
  const initial = defaultHomeActionPreferences()
  const moved = moveHomeAction(initial, 'wellbeing', -1, [
    'flexx',
    'tasks',
    'wellbeing',
  ])
  expect(moved.order).toEqual([
    'flexx',
    'wellbeing',
    'rewind',
    'tasks',
    'chill',
  ])
  expect(initial.order).toEqual(HOME_ACTION_IDS)
  expect(moveHomeAction(initial, 'flexx', -1, HOME_ACTION_IDS)).toBe(initial)
})

it('keeps Home readable if storage is blocked but exposes save failures for retry', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(readHomeActionSnapshot('owner')).toBeNull()
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(() =>
    saveHomeActionPreferences('owner', defaultHomeActionPreferences()),
  ).toThrow('blocked')
})
