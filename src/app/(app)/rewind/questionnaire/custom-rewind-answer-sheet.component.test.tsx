// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { CustomRewindAnswerSheet } from './custom-rewind-answer-sheet.component'

afterEach(cleanup)

it('preserves a custom answer after a failed save and lets the user retry it', async () => {
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(new Error('Try saving again'))
    .mockResolvedValueOnce(undefined)
  render(
    <CustomRewindAnswerSheet
      question="What stayed with you today?"
      initialValue=""
      onSave={onSave}
    />,
  )
  const input = screen.getByLabelText('In your own words')
  const save = screen.getByRole('button', {
    name: 'Use my custom Rewind answer',
  })
  expect(save.hasAttribute('disabled')).toBe(true)
  fireEvent.change(input, {
    target: { value: '  Finally called my sister 💛  ' },
  })
  fireEvent.click(save)
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toBe('Try saving again'),
  )
  expect(input.getAttribute('maxlength')).toBe('2000')
  expect(input).toHaveProperty('value', '  Finally called my sister 💛  ')
  fireEvent.click(save)
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2))
  expect(onSave).toHaveBeenLastCalledWith('Finally called my sister 💛')
})
