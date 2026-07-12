import { describe, expect, it } from 'vitest'
import { communityQueryKeys } from './community.query-keys'
import { goalQueryKeys } from './goal.query-keys'

describe('goal query keys', () => {
  it('keeps paged and infinite filter state inside the key factory', () => {
    expect(goalQueryKeys.list(2, 20, true)).toEqual([
      'goals',
      'list',
      { page: 2, limit: 20, canCheckIn: true },
    ])

    expect(goalQueryKeys.infinite(20, false, 'user-1')).toEqual([
      'goals',
      'list',
      'infinite',
      { limit: 20, canCheckIn: false, userId: 'user-1' },
    ])
  })
})

describe('community query keys', () => {
  it('exposes stable roots for infinite queries and invalidations', () => {
    expect(communityQueryKeys.activityRoot('community-1')).toEqual([
      'communities',
      'detail',
      'community-1',
      'activity',
    ])

    expect(communityQueryKeys.activity('community-1', 20)).toEqual([
      'communities',
      'detail',
      'community-1',
      'activity',
      { limit: 20 },
    ])

    expect(communityQueryKeys.invites('community-1')).toEqual([
      'communities',
      'invites',
      'community-1',
    ])
  })
})
