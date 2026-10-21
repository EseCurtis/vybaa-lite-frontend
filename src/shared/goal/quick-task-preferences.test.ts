// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest'

import {
  readQuickTaskPreferences,
  saveQuickTaskPreferences,
} from './quick-task-preferences'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

it('validates saved preferences, caps dismissal history and isolates accounts', () => {
  const value = { hidden: true, dismissedIds: ['one'] }
  saveQuickTaskPreferences('owner', value)
  expect(readQuickTaskPreferences('owner')).toEqual(value)
  expect(readQuickTaskPreferences('other')).toEqual({
    hidden: false,
    dismissedIds: [],
  })
  localStorage.setItem(
    'vybaa:quick-task:v1:owner',
    JSON.stringify({
      hidden: 'true',
      dismissedIds: [
        123,
        ...Array.from({ length: 120 }, (_, index) => String(index)),
      ],
    }),
  )
  expect(readQuickTaskPreferences('owner')).toEqual({
    hidden: false,
    dismissedIds: Array.from({ length: 100 }, (_, index) => String(index + 20)),
  })
})

it('recovers malformed or blocked storage without blocking the composer', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  localStorage.setItem('vybaa:quick-task:v1:owner', 'not json')
  expect(readQuickTaskPreferences('owner')).toEqual({
    hidden: false,
    dismissedIds: [],
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage denied', 'SecurityError')
  })
  expect(() =>
    saveQuickTaskPreferences('owner', { hidden: true, dismissedIds: [] }),
  ).not.toThrow()
  expect(warning).toHaveBeenCalledTimes(2)
})
