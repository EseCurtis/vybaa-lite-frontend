// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { useState } from 'react'
import type { ReactElement, ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { http } from '@/shared/api/http'
import type { FlexxAnswers } from '@/shared/flexx/flexx-answer'
import {
  parseFlexxDesign,
  starterFlexxDesigns,
} from '@/shared/flexx/flexx-design'
import { FlexxQuestionnaire } from './flexx-questionnaire.component'

const sheet = vi.hoisted(() => ({ present: vi.fn(), dismiss: vi.fn() }))
vi.mock('@/hooks/use-bottom-sheet.hook', () => ({
  useBottomSheet: () => sheet,
}))
vi.mock('@/shared/api/http', () => ({ http: { get: vi.fn(), post: vi.fn() } }))
const design = parseFlexxDesign({
  ...starterFlexxDesigns('rewind', 0)[0],
  id: 'collection:flexx-v3-99:0',
  layout: 'questionnaire',
  blocks: [],
  editorial: null,
  questionnaire: {
    question: 'What is taking up space in your mind today?',
    options: ['Feeling steady', 'A little overwhelmed', 'Taking it slowly'],
  },
})
let context: FlexxAnswers
let client: QueryClient

function Harness(): ReactElement {
  const [content, setContent] = useState<ReactNode>(null)
  sheet.present.mockImplementation((node: ReactNode) => setContent(node))
  sheet.dismiss.mockImplementation(() => setContent(null))
  return (
    <QueryClientProvider client={client}>
      <FlexxQuestionnaire design={design} userId="owner" />
      {content ? <div role="dialog">{content}</div> : null}
    </QueryClientProvider>
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  context = {
    localDateKey: '2026-10-20',
    personalizationEnabled: true,
    answers: [],
  }
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  vi.mocked(http.get).mockImplementation(async () => ({
    data: { data: context },
  }))
  vi.mocked(http.post).mockImplementation(async (_path, input: unknown) => {
    if (typeof input !== 'object' || input === null)
      throw new Error('Missing answer input')
    return {
      data: {
        data: {
          ...input,
          contributesToReflection: context.personalizationEnabled,
        },
      },
    }
  })
})
afterEach(() => {
  cleanup()
  client.clear()
  vi.restoreAllMocks()
})

async function openAnswer(): Promise<HTMLElement> {
  render(<Harness />)
  const button = await screen.findByRole('button', { name: 'Answer' })
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
  fireEvent.click(button)
  return screen.getByRole('dialog')
}

it('saves an explicitly selected answer to the server date and shows its reflection state', async () => {
  const dialog = await openAnswer()
  const choice = within(dialog).getByRole('button', { name: 'Feeling steady' })
  fireEvent.click(choice)
  expect(choice.getAttribute('aria-pressed')).toBe('true')
  expect(http.post).not.toHaveBeenCalled()
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await screen.findByText("Added to today's reflection")
  expect(http.post).toHaveBeenCalledWith(
    '/api/v1/flexx/questionnaire/answers',
    {
      designId: design.id,
      localDateKey: '2026-10-20',
      answer: 'Feeling steady',
      custom: false,
    },
  )
  expect(
    client.getQueryData<FlexxAnswers>(['flexx', 'answers', 'owner'])?.answers,
  ).toHaveLength(1)
  expect(screen.queryByRole('button', { name: 'Answer' })).toBeNull()
  expect(
    screen.getByText('Feeling steady').hasAttribute('data-html2canvas-ignore'),
  ).toBe(true)
})

it('preserves custom text after a failed save and retries without repeating AI generation', async () => {
  vi.mocked(http.post).mockRejectedValueOnce(new Error('Offline'))
  const dialog = await openAnswer()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Write my own' }))
  const field = within(dialog).getByRole('textbox', { name: 'Your answer' })
  fireEvent.change(field, { target: { value: 'I need a quieter evening.' } })
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await within(dialog).findByRole('alert')
  expect(field.getAttribute('maxlength')).toBe('800')
  if (!(field instanceof HTMLTextAreaElement))
    throw new Error('Expected an answer textarea')
  expect(field.value).toBe('I need a quieter evening.')
  await waitFor(() =>
    expect(
      within(dialog)
        .getByRole('button', { name: 'Save Flexx answer' })
        .hasAttribute('disabled'),
    ).toBe(false),
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await screen.findByText("Added to today's reflection")
  expect(http.post).toHaveBeenCalledTimes(2)
  expect(
    vi
      .mocked(http.get)
      .mock.calls.every(
        ([path]) => path === '/api/v1/flexx/questionnaire/answers',
      ),
  ).toBe(true)
})

it('does not promise AI contribution when personalization is disabled', async () => {
  context = { ...context, personalizationEnabled: false }
  const dialog = await openAnswer()
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Taking it slowly' }),
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await screen.findByText('Saved privately')
  expect(screen.queryByText("Added to today's reflection")).toBeNull()
})

it('requires another explicit confirmation after a day rollover and keeps the draft', async () => {
  vi.mocked(http.post).mockImplementationOnce(async () => {
    context = { ...context, localDateKey: '2026-10-21' }
    throw Object.assign(new Error('Day changed'), {
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          msg: 'Your local day changed. Refresh and confirm your answer again.',
        },
      },
    })
  })
  const dialog = await openAnswer()
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Feeling steady' }),
  )
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await within(dialog).findByRole('alert')
  await waitFor(() =>
    expect(
      client.getQueryData<FlexxAnswers>(['flexx', 'answers', 'owner'])
        ?.localDateKey,
    ).toBe('2026-10-21'),
  )
  expect(http.post).toHaveBeenCalledTimes(1)
  fireEvent.click(
    within(dialog).getByRole('button', { name: 'Save Flexx answer' }),
  )
  await screen.findByText("Added to today's reflection")
  expect(http.post).toHaveBeenLastCalledWith(
    '/api/v1/flexx/questionnaire/answers',
    expect.objectContaining({
      localDateKey: '2026-10-21',
      answer: 'Feeling steady',
    }),
  )
})
