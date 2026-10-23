// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Input } from './input.component'

afterEach(cleanup)

it('associates labels, helpers and errors with unique inputs', () => {
  const { rerender } = render(
    <>
      <Input label="Email" helperText="Your email" aria-describedby="extra" />
      <Input label="Other email" />
    </>,
  )
  const input = screen.getByLabelText('Email')
  expect(input.id).not.toBe(screen.getByLabelText('Other email').id)
  expect(input.getAttribute('aria-describedby')).toBe(
    `extra ${input.id}-message`,
  )
  rerender(
    <>
      <Input label="Email" error="Check your email." aria-describedby="extra" />
      <Input label="Other email" />
    </>,
  )
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(screen.getByRole('status').id).toBe(`${input.id}-message`)
  expect(screen.queryByText('Your email')).toBeNull()
})

it('provides a keyboard-accessible password visibility toggle without submitting', () => {
  render(
    <form>
      <Input label="Password" type="password" defaultValue="secret" />
    </form>,
  )
  const toggle = screen.getByRole('button', { name: 'Show password' })
  expect(toggle.getAttribute('type')).toBe('button')
  expect(toggle.tabIndex).toBe(0)
  fireEvent.click(toggle)
  expect(screen.getByLabelText('Password').getAttribute('type')).toBe('text')
  expect(
    screen
      .getByRole('button', { name: 'Hide password' })
      .getAttribute('aria-pressed'),
  ).toBe('true')
})
