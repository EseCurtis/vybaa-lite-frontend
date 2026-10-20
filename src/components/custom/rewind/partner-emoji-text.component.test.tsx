// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { PartnerEmojiText } from './partner-emoji-text.component'

afterEach(cleanup)

it('keeps text and uses the speaking partner for expressive inline emojis', () => {
  const { container } = render(
    <PartnerEmojiText content="You did it 🎉 keep going" partnerId="tobi" />,
  )
  expect(container.textContent).toBe('You did it  keep going')
  expect(screen.getByAltText('Tobi, cheering').getAttribute('src')).toContain(
    '/tobi/cheering.webp',
  )
})

it('renders sent stickers after reload without requiring new server message fields', () => {
  render(<PartnerEmojiText content=":vybaa/neeja/love:" />)
  expect(screen.getByAltText('Neeja, love').className).toContain('size-28')
})

it('does not reinterpret user emojis or swallow invalid tokens', () => {
  const { container } = render(
    <PartnerEmojiText content="😂 :vybaa/nope/love:" />,
  )
  expect(container.textContent).toBe('😂 :vybaa/nope/love:')
  expect(container.querySelector('img')).toBeNull()
})
