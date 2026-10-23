import { expect, it } from 'vitest'
import { getWalkthroughDefinition, WALKTHROUGHS } from './walkthrough.config'

it('covers current main screens and keeps existing completion IDs stable', () => {
  expect(WALKTHROUGHS['/app/home'].id).toBe('home-main')
  expect(WALKTHROUGHS['/app/goal'].id).toBe('goals-library')
  expect(getWalkthroughDefinition('/app/goal/')?.id).toBe('goals-library')
  expect(getWalkthroughDefinition('/app/actions/flexx')?.steps.length).toBe(3)
  expect(getWalkthroughDefinition('/app/goal/task-id')?.id).toBe('task-details')
  expect(getWalkthroughDefinition('/app/goal/create')?.id).toBe('goal-creation')
  expect(getWalkthroughDefinition('/app/rewind-chat/chat-id')?.id).toBe(
    'rewind-conversation',
  )
  expect(getWalkthroughDefinition('/app/onboarding/about-you')).toBeNull()
})

it('uses real current navigation targets without a back button on the chat main tab', () => {
  const chats = getWalkthroughDefinition('/app/rewind-chats')
  expect(chats?.steps.map((step) => step.selector)).not.toContain(
    '[data-testid="tab-header-back"]',
  )
  expect(
    chats?.steps.some((step) => step.selector.includes('tab-rewind-chats')),
  ).toBe(true)
  const home = getWalkthroughDefinition('/app/home')
  expect(home?.steps[0].selector).toContain('home-action-my-tasks')
  expect(home?.steps[1].selector).toContain('^="home-action-rewind')
  expect(
    getWalkthroughDefinition('/app/goal/create')?.steps[0].title,
  ).not.toContain('Four')
})
