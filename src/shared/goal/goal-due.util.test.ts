import { describe, expect, it } from 'vitest'

import { goalNeedsAttention } from './goal-due.util'

describe('goal due indicators', () => {
  it('shows attention for active due and overdue goals', () => {
    expect(
      goalNeedsAttention({ isDue: true, isOverdue: false, status: 'ACTIVE' }),
    ).toBe(true)
    expect(
      goalNeedsAttention({ isDue: true, isOverdue: true, status: 'ACTIVE' }),
    ).toBe(true)
  })

  it('does not mark inactive or future goals', () => {
    expect(
      goalNeedsAttention({ isDue: false, isOverdue: false, status: 'ACTIVE' }),
    ).toBe(false)
    expect(
      goalNeedsAttention({ isDue: true, isOverdue: false, status: 'PAUSED' }),
    ).toBe(false)
  })
})
