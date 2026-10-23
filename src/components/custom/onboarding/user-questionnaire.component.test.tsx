// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { questionnaireFixture } from '@/shared/onboarding/questionnaire.test-fixture'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import { UserQuestionnaire } from './user-questionnaire.component'

beforeEach(() => sessionStorage.clear())
afterEach(cleanup)

it('offers an optional, non-diagnostic introduction and preserves choices when going back', () => {
  render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  expect(screen.getByText(/not a personality test/)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'A little humour' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Practical advice' }))
  expect(
    screen
      .getByRole('checkbox', { name: 'Practical advice' })
      .getAttribute('aria-checked'),
  ).toBe('false')
  fireEvent.change(screen.getByLabelText('Your own answer'), {
    target: { value: 'Give me a moment first' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Back' }))
  expect(
    screen
      .getByRole('checkbox', { name: 'Listening first' })
      .getAttribute('aria-checked'),
  ).toBe('true')
  expect(screen.getByLabelText('Your own answer')).toHaveProperty(
    'value',
    'Give me a moment first',
  )
})

it('allows skipping and editing before sending only explicit answers', () => {
  const save = vi.fn()
  render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={save}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Skip this question' }))
  expect(screen.getByText('Skipped')).toBeTruthy()
  expect(save).not.toHaveBeenCalled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Edit: What support fits you?' }),
  )
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  fireEvent.change(screen.getByLabelText('Your own answer'), {
    target: { value: 'A quiet check-in' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Save my preferences' }))
  expect(save).toHaveBeenCalledWith({
    version: 1,
    revision: 0,
    skipped: false,
    answers: [
      { questionId: 'support', choices: [], customText: 'A quiet check-in' },
    ],
  })
})

it('resumes a draft for the same account without leaking it to another', () => {
  const view = render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  view.unmount()
  const resumed = render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  expect(
    screen
      .getByRole('checkbox', { name: 'Listening first' })
      .getAttribute('aria-checked'),
  ).toBe('true')
  resumed.unmount()
  render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="other"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Let’s do it' })).toBeTruthy()
})

it('explains disabled personalization without changing it', () => {
  render(
    <UserQuestionnaire
      data={{ ...questionnaireFixture, personalizationEnabled: false }}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  expect(screen.getByText(/Personalization is off/)).toBeTruthy()
  expect(screen.queryByRole('switch')).toBeNull()
})

it('uses radios for one choice, supports arrow navigation, and allows clearing an optional answer', () => {
  render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  const first = screen.getByRole('radio', { name: 'Predictable' })
  const second = screen.getByRole('radio', { name: 'Always changing' })
  expect(first.tabIndex).toBe(0)
  expect(second.tabIndex).toBe(-1)
  first.focus()
  fireEvent.keyDown(first, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(second)
  expect(second.getAttribute('aria-checked')).toBe('true')
  expect(first.getAttribute('aria-checked')).toBe('false')
  fireEvent.keyDown(second, { key: 'Home' })
  expect(document.activeElement).toBe(first)
  expect(first.getAttribute('aria-checked')).toBe('true')
  fireEvent.click(first)
  expect(first.getAttribute('aria-checked')).toBe('false')
  expect(screen.getByRole('radiogroup')).toBeTruthy()
  expect(screen.queryByText('Your rhythm · 2 of 2')).toBeNull()
})

it('shows checkmarks, announces the limit and keeps decorations fixed while selecting', () => {
  const view = render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  const before = view.container.querySelector('svg[fill="currentColor"]')
    ?.parentElement?.innerHTML
  const choice = screen.getByRole('checkbox', { name: 'Listening first' })
  expect(choice.querySelector('[data-selection-kind="checkmark"]')).toBeTruthy()
  fireEvent.click(choice)
  expect(choice.querySelector('svg')).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('1/2 selected')
  expect(
    view.container.querySelector('svg[fill="currentColor"]')?.parentElement
      ?.innerHTML,
  ).toBe(before)
})

it('preserves the draft and disables all changes while saving', () => {
  const props = { data: questionnaireFixture, userId: 'owner', onSave: vi.fn() }
  const view = render(<UserQuestionnaire {...props} saving={false} />)
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  const choice = screen.getByRole('checkbox', { name: 'Listening first' })
  fireEvent.click(choice)
  view.rerender(<UserQuestionnaire {...props} saving />)
  fireEvent.click(choice)
  expect(choice).toHaveProperty('disabled', true)
  expect(choice.getAttribute('aria-checked')).toBe('true')
  expect(screen.getByLabelText('Your own answer')).toHaveProperty(
    'disabled',
    true,
  )
})

it('reviews numbered questions with separate choices, custom replies, and all six partners', () => {
  render(
    <UserQuestionnaire
      data={questionnaireFixture}
      userId="owner"
      saving={false}
      onSave={vi.fn()}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Let’s do it' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Listening first' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'A little humour' }))
  fireEvent.change(screen.getByLabelText('Your own answer'), {
    target: { value: 'A little space first.\nThen we can talk.' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  fireEvent.click(screen.getByRole('button', { name: 'Skip this question' }))

  const rows = within(
    screen.getByRole('list', { name: 'Your answers' }),
  ).getAllByRole('listitem')
  expect(rows).toHaveLength(2)
  const first = rows[0]
  const second = rows[1]
  if (!first || !second) throw new Error('Missing numbered answers')
  expect(within(first).getByText('1.')).toBeTruthy()
  expect(within(second).getByText('2.')).toBeTruthy()
  const listening = within(first).getByText('Listening first')
  const humour = within(first).getByText('A little humour')
  expect(listening.parentElement).not.toBe(humour.parentElement)
  expect(
    within(first).queryByText('Listening first · A little humour'),
  ).toBeNull()
  expect(within(first).getByText(/A little space first/).textContent).toBe(
    'A little space first.\nThen we can talk.',
  )
  expect(within(second).getByText('Skipped')).toBeTruthy()
  const partners = screen.getByRole('img', {
    name: 'All six Rewind partners together',
  })
  expect(partners.querySelectorAll('img')).toHaveLength(REWIND_PERSONAS.length)
  for (const partner of REWIND_PERSONAS) {
    expect(
      partners.querySelector(`img[src*="/${partner.id}/cheering.webp"]`),
    ).toBeTruthy()
  }
  fireEvent.click(
    within(first).getByRole('button', { name: 'Edit: What support fits you?' }),
  )
  expect(
    screen
      .getByRole('checkbox', { name: 'Listening first' })
      .getAttribute('aria-checked'),
  ).toBe('true')
  expect(screen.getByLabelText('Your own answer')).toHaveProperty(
    'value',
    'A little space first.\nThen we can talk.',
  )
})
