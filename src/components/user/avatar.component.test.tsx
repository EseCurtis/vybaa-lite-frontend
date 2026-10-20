// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { adjustColor, seededColor } from '@/shared/utils/helpers.util'

import { Avatar } from './avatar.component'

const USER = {
  id: 'avatar-user',
  firstName: 'Ada',
  lastName: 'Lovelace',
  username: 'ada',
}

afterEach(cleanup)

describe('shared user avatar', () => {
  it.each([
    { user: USER, initials: 'AL' },
    { user: { firstName: 'Ada' }, initials: 'Ad' },
    { user: { username: 'ada' }, initials: 'ad' },
    {
      user: { firstName: null, lastName: null, username: 'ada' },
      initials: 'ad',
    },
    { user: undefined, initials: 'U' },
  ])(
    'uses homepage initials for $initials without requesting an empty image',
    ({ user, initials }) => {
      const { container } = render(<Avatar user={user} />)
      expect(screen.getByText(initials)).toBeTruthy()
      expect(container.querySelector('img')).toBeNull()
    },
  )

  it('preserves the existing homepage seeded background and initials color', () => {
    render(<Avatar user={USER} size={50} />)
    const color = seededColor(JSON.stringify(USER))
    const expected = document.createElement('div')
    expected.style.background = color
    expected.style.color = adjustColor(color, {
      lightness: -30,
      saturation: -20,
    })
    expect(
      screen.getByRole('img', { name: 'Ada Lovelace avatar' }).style.background,
    ).toBe(expected.style.background)
    expect(screen.getByText('AL').style.color).toBe(expected.style.color)
  })

  it('keeps user photos ahead of legacy URL fallback and allows an explicit editing preview', () => {
    const user = { ...USER, avatarUrl: '/saved-photo.png' }
    const { container, rerender } = render(
      <Avatar user={user} url="/fallback.png" />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/saved-photo.png',
    )
    rerender(
      <Avatar
        user={user}
        url="/fallback.png"
        previewUrl="data:image/png;base64,preview"
      />,
    )
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      'data:image/png;base64,preview',
    )
  })

  it('falls back to initials after failure and loads a replacement photo without remounting', () => {
    const { container, rerender } = render(
      <Avatar user={{ ...USER, avatarUrl: '/broken.png' }} />,
    )
    const image = container.querySelector('img')
    if (!image) throw new Error('Photo not rendered')
    fireEvent.error(image)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('AL')).toBeTruthy()
    rerender(<Avatar user={{ ...USER, avatarUrl: '/replacement.png' }} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/replacement.png',
    )
  })

  it('retains URL-only consumers and their requested size', () => {
    const { container } = render(<Avatar url="/url-only.png" size={36} />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(
      '/url-only.png',
    )
    expect(screen.getByRole('img').style.width).toBe('36px')
  })
})
