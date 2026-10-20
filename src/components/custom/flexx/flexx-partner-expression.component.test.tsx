// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { FlexxPartnerExpression } from './flexx-partner-expression.component'

afterEach(cleanup)

it('uses the author identity with reserved space, decorative semantics and no overlay positioning', () => {
  const { container } = render(
    <FlexxPartnerExpression
      partnerId="tobi"
      expression="thinking"
      className="w-24"
    />,
  )
  const wrapper = container.firstElementChild
  const img = wrapper?.querySelector('img')
  expect(wrapper?.getAttribute('data-flexx-expression')).toBe('tobi:thinking')
  expect(wrapper?.className).not.toContain('absolute')
  expect(wrapper?.getAttribute('aria-hidden')).toBe('true')
  expect(img?.getAttribute('src')).toBe(
    '/assets/rewind/expressions/v1/tobi/thinking.webp',
  )
  expect(img?.getAttribute('width')).toBe('480')
  expect(img?.getAttribute('height')).toBe('480')
  expect(img?.getAttribute('alt')).toBe('')
})

it('retains the slot on image failure and can display another expression afterwards', () => {
  const { container, rerender } = render(
    <FlexxPartnerExpression partnerId="lyra" expression="thinking" />,
  )
  const img = container.querySelector('img')
  if (!img) throw new Error('Expected the expression image')
  fireEvent.error(img)
  expect(container.querySelector('img')).toBeNull()
  expect(container.firstElementChild?.classList.contains('aspect-square')).toBe(
    true,
  )
  rerender(<FlexxPartnerExpression partnerId="lyra" expression="calm" />)
  expect(container.querySelector('img')?.getAttribute('src')).toBe(
    '/assets/rewind/expressions/v1/lyra/calm.webp',
  )
})
