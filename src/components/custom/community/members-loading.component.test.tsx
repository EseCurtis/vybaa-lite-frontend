// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import type { CommunityMember } from '@/shared/api/community.api'
import { MembersTab } from './members-tab.component'

vi.mock('@tanstack/react-router', () => ({ useNavigate: () => vi.fn() }))
afterEach(cleanup)

const member: CommunityMember = {
  id: 'member',
  userId: 'user',
  communityId: 'community',
  role: 'MEMBER',
  joinedAt: '2026-10-16',
  user: {
    id: 'user',
    username: 'ada',
    firstName: 'Ada',
    lastName: null,
    avatarUrl: null,
  },
}

it('preserves existing members while more data is loading', () => {
  const { container, rerender } = render(
    <MembersTab members={[member]} isLoading isPreview />,
  )
  expect(screen.getByText('ada')).toBeDefined()
  expect(container.querySelector('.vybaa-skeleton')).toBeNull()
  rerender(<MembersTab members={[member]} isLoading={false} isPreview />)
  expect(screen.getByText('ada')).toBeDefined()
})

it('uses member-shaped skeletons only before the first data arrives', () => {
  const { container } = render(<MembersTab members={[]} isLoading isPreview />)
  expect(container.querySelectorAll('.vybaa-skeleton')).toHaveLength(12)
  expect(screen.queryByText('No members yet')).toBeNull()
})
