import { describe, expect, it } from 'vitest'

import { getAppParentPath, getAppTabRoot } from './app-navigation.util'

describe('app navigation hierarchy', () => {
  it('resolves community children to their owning stack', () => {
    expect(getAppParentPath('/app/community/activity/community_123')).toBe(
      '/app/community/community_123',
    )
    expect(getAppParentPath('/app/community/community_123')).toBe(
      '/app/communities',
    )
    expect(getAppTabRoot('/app/community/community_123')).toBe(
      '/app/communities',
    )
  })

  it('keeps Rewind review routes in one predictable stack', () => {
    expect(getAppParentPath('/app/r/rewind_123')).toBe(
      '/app/rewind-history-sessions',
    )
    expect(getAppParentPath('/app/rewind-history-sessions')).toBe(
      '/app/rewind-history',
    )
    expect(getAppParentPath('/app/rewind-history')).toBe('/app/rewind')
    expect(getAppParentPath('/app/rewind-observations')).toBe('/app/rewind')
    expect(getAppParentPath('/app/rewind-chats')).toBe('/app/rewind')
    expect(getAppParentPath('/app/rewind-chat/chat_123')).toBe(
      '/app/rewind-chats',
    )
  })

  it('does not treat one root tab as a child of another tab', () => {
    expect(getAppParentPath('/app/goal')).toBeNull()
    expect(getAppTabRoot('/app/goal')).toBe('/app/goal')
  })
})
