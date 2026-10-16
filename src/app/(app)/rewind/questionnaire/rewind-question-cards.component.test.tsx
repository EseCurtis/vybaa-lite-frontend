// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { RewindQuestionCards } from './rewind-question-cards.component'

afterEach(cleanup)

it('shows a visual preparation state without a question counter or introductory copy', () => {
  render(<RewindQuestionCards question={null} index={0} total={4} />)
  expect(screen.getByRole('status').getAttribute('aria-label')).toBe(
    "Preparing today's questions",
  )
  expect(screen.queryByText('1 / 4')).toBeNull()
  expect(
    screen.queryByText('A little space to check in with yourself.'),
  ).toBeNull()
  expect(screen.getByRole('status').querySelectorAll('span')).toHaveLength(6)
})

it('shows progress only when there is an actual question', () => {
  render(
    <RewindQuestionCards
      question={{
        id: 'q2',
        text: 'What lifted your mood?',
        emoji: '💛',
        options: ['A friend'],
      }}
      index={1}
      total={4}
    />,
  )
  expect(screen.getByText('What lifted your mood?')).toBeDefined()
  expect(screen.getByText('2 / 4')).toBeDefined()
  expect(screen.queryByRole('status')).toBeNull()
})

it('keeps the finished state distinct from preparation and hides the counter', () => {
  render(<RewindQuestionCards question={null} complete index={4} total={4} />)
  expect(screen.getByText('A little clearer. A little more you.')).toBeDefined()
  expect(screen.queryByText('4 / 4')).toBeNull()
  expect(screen.queryByRole('status')).toBeNull()
})
