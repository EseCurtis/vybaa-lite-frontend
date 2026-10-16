// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, expect, it, vi } from 'vitest'

import { rewindQuestionnaireAPI } from '@/shared/api/rewind-questionnaire.api'
import type { RewindQuestionnaire } from '@/shared/api/rewind-questionnaire.api'
import { useRewindQuestionnaire } from './use-rewind-questionnaire.hook'

vi.mock('@/shared/api/rewind-questionnaire.api', () => ({
  rewindQuestionnaireAPI: { start: vi.fn(), answer: vi.fn(), finish: vi.fn() },
}))
afterEach(() => vi.resetAllMocks())

const deck: RewindQuestionnaire = {
  sessionId: 'session-1',
  personaId: 'ella',
  sessionDateKey: '2026-10-16',
  status: 'IN_PROGRESS',
  questions: [
    {
      id: 'first',
      text: 'What stayed with you today?',
      emoji: '💭',
      options: ['A small win', 'A conversation', 'Some quiet time'],
    },
  ],
  answers: [],
}

it('keeps the current question and saved answers when a save fails, then resumes after retry', async () => {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  vi.mocked(rewindQuestionnaireAPI.start).mockResolvedValue(deck)
  const { result } = renderHook(() => useRewindQuestionnaire('user-1'), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })
  await act(async () => {
    await result.current.start.mutateAsync()
  })
  await waitFor(() => expect(result.current.deck?.sessionId).toBe('session-1'))
  const answer = { questionId: 'first', text: 'A small win', custom: false }
  vi.mocked(rewindQuestionnaireAPI.answer)
    .mockRejectedValueOnce(new Error('Connection interrupted'))
    .mockResolvedValueOnce({ ...deck, answers: [answer] })
  await act(async () => {
    await expect(result.current.answer.mutateAsync(answer)).rejects.toThrow(
      'Connection interrupted',
    )
  })
  expect(result.current.deck?.answers).toEqual([])
  await act(async () => {
    await result.current.answer.mutateAsync(answer)
  })
  await waitFor(() => expect(result.current.deck?.answers).toEqual([answer]))
  expect(rewindQuestionnaireAPI.answer).toHaveBeenLastCalledWith(
    'session-1',
    answer,
  )
  client.clear()
})

it('hides the previous user’s questionnaire when the signed-in account changes', async () => {
  const client = new QueryClient()
  vi.mocked(rewindQuestionnaireAPI.start).mockResolvedValue(deck)
  const { result, rerender } = renderHook(
    ({ userId }) => useRewindQuestionnaire(userId),
    {
      initialProps: { userId: 'user-1' },
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )
  await act(async () => {
    await result.current.start.mutateAsync()
  })
  await waitFor(() => expect(result.current.deck).not.toBeNull())
  rerender({ userId: 'user-2' })
  expect(result.current.deck).toBeNull()
  client.clear()
})
