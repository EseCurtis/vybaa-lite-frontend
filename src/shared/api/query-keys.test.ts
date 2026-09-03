import { describe, expect, it } from 'vitest'
import { communityQueryKeys } from './community.query-keys'
import { goalQueryKeys } from './goal.query-keys'
import { rewindQueryKeys } from './rewind.query-keys'

describe('goal query keys', () => {
  it('keeps lifecycle filters and occurrence history in stable keys', () => {
    expect(goalQueryKeys.list('DUE')).toEqual(['goals-v2', 'list', 'DUE'])

    expect(goalQueryKeys.occurrences('goal-1')).toEqual([
      'goals-v2',
      'detail',
      'goal-1',
      'occurrences',
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

describe('Rewind intelligence query keys', () => {
  it('keeps chats, messages, observations, and greetings independently cacheable', () => {
    expect(rewindQueryKeys.chats()).toEqual(['rewind', 'chats'])
    expect(rewindQueryKeys.chatMessages('chat-1')).toEqual([
      'rewind',
      'chats',
      'chat-1',
      'messages',
    ])
    expect(rewindQueryKeys.observations()).toEqual(['rewind', 'observations'])
    expect(rewindQueryKeys.homeGreeting()).toEqual(['rewind', 'home-greeting'])
  })
})
