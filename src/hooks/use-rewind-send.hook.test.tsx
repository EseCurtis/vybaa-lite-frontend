// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { expect, it, vi } from 'vitest'

import { rewindAPI } from '@/shared/api/rewind.api'
import type { RewindChatMessage } from '@/shared/api/rewind.api'
import { useEnqueueRewindChatMessage } from './use-rewind.hook'

vi.mock('@/shared/api/rewind.api', () => ({
  rewindAPI: { enqueueV2ChatMessage: vi.fn() },
}))

it('acknowledges the optimistic bubble before refreshing message history', async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const order: string[] = []
  vi.spyOn(client, 'invalidateQueries').mockImplementation(async () => {
    order.push('refresh')
  })
  const message: RewindChatMessage = {
    id: 'saved-message',
    content: 'hey',
    createdAt: '2026-09-08T12:00:00Z',
    localDateKey: '2026-09-08',
    mentions: [],
    personaId: null,
    role: 'USER',
  }
  vi.mocked(rewindAPI.enqueueV2ChatMessage).mockResolvedValue({
    data: { userMessage: message, runId: 'run-1' },
    msg: 'Message accepted',
  })
  const accepted = vi.fn(() => {
    order.push('accepted')
  })
  const { result } = renderHook(
    () => useEnqueueRewindChatMessage('chat-1', accepted),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  await act(async () => {
    await result.current.mutateAsync({
      content: 'hey',
      idempotencyKey: 'optimistic-1',
    })
  })
  expect(order).toEqual(['accepted', 'refresh', 'refresh'])
  expect(accepted).toHaveBeenCalledWith(
    { ...message, runId: 'run-1' },
    'optimistic-1',
  )
  client.clear()
})
