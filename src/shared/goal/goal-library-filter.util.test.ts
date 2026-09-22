import { describe, expect, it } from 'vitest'

import {
  getGoalLibraryTab,
  parseGoalListFilter,
} from './goal-library-filter.util'

describe('goal library filter navigation', () => {
  it('maps list filters to their visible tabs', () => {
    expect(getGoalLibraryTab('ACTIVE')).toBe('Active')
    expect(getGoalLibraryTab('DUE')).toBe('Active')
    expect(getGoalLibraryTab('OVERDUE')).toBe('Active')
    expect(getGoalLibraryTab('PAUSED')).toBe('Paused')
    expect(getGoalLibraryTab('ENDED')).toBe('Ended')
    expect(getGoalLibraryTab('ARCHIVED')).toBe('Ended')
  })

  it('accepts only supported URL filters', () => {
    expect(parseGoalListFilter('ENDED')).toBe('ENDED')
    expect(parseGoalListFilter('unknown')).toBeUndefined()
    expect(parseGoalListFilter(null)).toBeUndefined()
  })
})
