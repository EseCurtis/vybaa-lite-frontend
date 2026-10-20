// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { useRewindQuestionnaire } from '@/hooks/use-rewind-questionnaire.hook'
import { rewindQuestionnaireAPI } from '@/shared/api/rewind-questionnaire.api'
import type { RewindQuestionnaire } from '@/shared/api/rewind-questionnaire.api'
import { RewindQuestionnaireContent } from './rewind-questionnaire.component'

const sheet = vi.hoisted(() => ({
  present: vi.fn<(content: ReactNode, options: { title: string }) => void>(),
  dismiss: vi.fn(),
}))
vi.mock('@/providers/bottom-sheet.provider', () => ({
  useBottomSheetController: () => sheet,
}))
vi.mock('@/components/custom/rewind/rewind-countdown-timer.component', () => ({
  RewindCountdownTimer: () => null,
}))
vi.mock('@/shared/api/rewind-questionnaire.api', () => ({
  rewindQuestionnaireAPI: { start: vi.fn(), answer: vi.fn(), finish: vi.fn() },
}))

const longAnswer =
  'I needed a little more time to work through everything that happened today 💭'
const unbrokenAnswer = 'Overwhelmed'.repeat(25)
const deck: RewindQuestionnaire = {
  sessionId: 'session',
  personaId: 'ella',
  sessionDateKey: '2026-10-18',
  status: 'IN_PROGRESS',
  answers: [],
  questions: [
    {
      id: 'q1',
      text: 'How did today feel?',
      emoji: '💭',
      options: [longAnswer, unbrokenAnswer, 'Good 💛'],
    },
  ],
}
let client: QueryClient
beforeEach(() => {
  vi.clearAllMocks()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.mocked(rewindQuestionnaireAPI.start).mockResolvedValue(deck)
  vi.mocked(rewindQuestionnaireAPI.answer).mockResolvedValue(deck)
})
afterEach(() => {
  cleanup()
  client.clear()
})

function Harness(): ReactNode {
  const questionnaire = useRewindQuestionnaire('owner')
  return (
    <RewindQuestionnaireContent
      questionnaire={questionnaire}
      available
      startLabel="Start Rewind"
      onStart={() => questionnaire.start.mutate()}
      onCompleted={() => {}}
    />
  )
}

async function openQuestion(): Promise<void> {
  render(
    <QueryClientProvider client={client}>
      <Harness />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Start Rewind' }))
  await screen.findByRole('group', { name: 'Choose your answer' })
}

it('constrains every answer pill and wraps long and unbroken text without truncating it', async () => {
  await openQuestion()
  for (const answer of [longAnswer, unbrokenAnswer]) {
    const pill = screen.getByRole('button', { name: answer })
    expect(pill.classList.contains('max-w-full')).toBe(true)
    expect(pill.classList.contains('min-w-0')).toBe(true)
    const text = screen.getByText(answer)
    expect(text.classList.contains('[overflow-wrap:anywhere]')).toBe(true)
    expect(text.classList.contains('whitespace-normal')).toBe(true)
    expect(text.classList.contains('line-clamp-2')).toBe(false)
  }
  fireEvent.click(screen.getByRole('button', { name: longAnswer }))
  expect(
    screen
      .getByRole('button', { name: longAnswer })
      .getAttribute('aria-pressed'),
  ).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() =>
    expect(rewindQuestionnaireAPI.answer).toHaveBeenCalledWith('session', {
      questionId: 'q1',
      text: longAnswer,
      custom: false,
    }),
  )
})

it('keeps the custom answer preview compact while submitting its complete text', async () => {
  await openQuestion()
  fireEvent.click(screen.getByRole('button', { name: 'In my own words' }))
  const content = sheet.present.mock.calls[0]?.[0]
  expect(content).toBeDefined()
  const customSheet = render(content)
  fireEvent.change(screen.getByLabelText('In your own words'), {
    target: { value: unbrokenAnswer },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Use my custom Rewind answer' }),
  )
  await waitFor(() => expect(sheet.dismiss).toHaveBeenCalled())
  customSheet.unmount()
  const preview = screen
    .getAllByText(unbrokenAnswer)
    .find((element) => element.classList.contains('line-clamp-2'))
  expect(preview?.classList.contains('min-w-0')).toBe(true)
  expect(preview?.classList.contains('[overflow-wrap:anywhere]')).toBe(true)
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  await waitFor(() =>
    expect(rewindQuestionnaireAPI.answer).toHaveBeenCalledWith('session', {
      questionId: 'q1',
      text: unbrokenAnswer,
      custom: true,
    }),
  )
})
