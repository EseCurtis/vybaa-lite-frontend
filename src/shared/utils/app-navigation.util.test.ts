import { describe, expect, it, vi } from 'vitest'

import {
  getAppNavigationTransition,
  getAppParentPath,
  getAppTabRoot,
  navigateBackWithinApp,
} from './app-navigation.util'

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

  it('classifies tabs by their visual order instead of treating them as pushes', () => {
    expect(getAppNavigationTransition('/app/home', '/app/journal')).toBe(
      'vybaa-tab-forward',
    )
    expect(getAppNavigationTransition('/app/profile', '/app/goal')).toBe(
      'vybaa-tab-back',
    )
  })

  it('classifies child routes as stacked pushes and pops', () => {
    expect(getAppNavigationTransition('/app/goal', '/app/goal/goal_123')).toBe(
      'vybaa-push',
    )
    expect(getAppNavigationTransition('/app/goal/goal_123', '/app/goal')).toBe(
      'vybaa-pop',
    )
    expect(
      getAppNavigationTransition(
        '/app/rewind-history',
        '/app/rewind-history-sessions',
      ),
    ).toBe('vybaa-push')
  })

  it('presents goal creation as a workflow above the active stack', () => {
    expect(getAppNavigationTransition('/app/home', '/app/goal/create')).toBe(
      'vybaa-workflow-forward',
    )
    expect(getAppNavigationTransition('/app/goal/create', '/app/goal')).toBe(
      'vybaa-workflow-back',
    )
  })

  it('uses the actual history entry before an inferred parent route', async () => {
    const back = vi.fn()
    const navigate = vi.fn()
    const router: Parameters<typeof navigateBackWithinApp>[0] = {
      history: { back, canGoBack: () => true },
      navigate,
    }

    await navigateBackWithinApp(
      router,
      '/app/r/rewind_123',
      '/app/rewind-history',
    )

    expect(back).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('uses a fallback only when there is no history entry', async () => {
    const navigate = vi.fn().mockResolvedValue(undefined)
    const router: Parameters<typeof navigateBackWithinApp>[0] = {
      history: { back: vi.fn(), canGoBack: () => false },
      navigate,
    }

    await navigateBackWithinApp(
      router,
      '/app/r/rewind_123',
      '/app/rewind-history',
    )

    expect(navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/app/rewind-history',
    })
  })

  it('always returns chat detail to the conversation list', async () => {
    const back = vi.fn()
    const navigate = vi.fn().mockResolvedValue(undefined)
    const router: Parameters<typeof navigateBackWithinApp>[0] = {
      history: { back, canGoBack: () => true },
      navigate,
    }

    await navigateBackWithinApp(router, '/app/rewind-chat/chat_123')

    expect(back).not.toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith({
      replace: true,
      to: '/app/rewind-chats',
    })
  })

  it('keeps chat settings history behavior separate from chat detail', async () => {
    const back = vi.fn()
    const navigate = vi.fn()
    const router: Parameters<typeof navigateBackWithinApp>[0] = {
      history: { back, canGoBack: () => true },
      navigate,
    }

    await navigateBackWithinApp(
      router,
      '/app/rewind-chat/chat_123/settings',
      '/app/rewind-chat/chat_123',
    )

    expect(back).toHaveBeenCalledOnce()
    expect(navigate).not.toHaveBeenCalled()
  })
})
