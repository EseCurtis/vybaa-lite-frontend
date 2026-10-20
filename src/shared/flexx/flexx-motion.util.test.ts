// @vitest-environment jsdom
import { expect, it } from 'vitest'

import { freezeFlexxForExport } from './flexx-motion.util'

it('freezes only the cloned poster and resets animated transforms for crisp still exports', () => {
  const original = document.implementation.createHTMLDocument()
  const poster = original.createElement('div')
  poster.setAttribute('data-flexx-animate', 'true')
  const number = original.createElement('span')
  number.setAttribute('data-flexx-loop', 'metric')
  number.textContent = '42'
  number.style.transform = 'scale(1.018)'
  poster.appendChild(number)
  original.body.appendChild(poster)
  const clone = document.implementation.createHTMLDocument()
  clone.body.appendChild(poster.cloneNode(true))
  freezeFlexxForExport(clone)
  const frozen = clone.querySelector<HTMLElement>('[data-flexx-loop]')
  expect(frozen?.style.animation).toBe('none')
  expect(frozen?.style.transform).toBe('none')
  expect(frozen?.textContent).toBe('42')
  expect(
    clone
      .querySelector('[data-flexx-animate]')
      ?.getAttribute('data-flexx-animate'),
  ).toBe('false')
  expect(poster.getAttribute('data-flexx-animate')).toBe('true')
  expect(number.style.transform).toBe('scale(1.018)')
})
