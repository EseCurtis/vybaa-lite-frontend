// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { partnerEmojiToken } from '@/shared/rewind/partner-emojis'
import { PARTNER_EMOTIONS } from '@/shared/rewind/partner-emojis'
import { REWIND_PERSONAS } from '@/shared/rewind/rewind-personas'
import { PartnerEmojiPicker } from './partner-emoji-picker.component'

beforeEach(() => localStorage.clear())
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('shows every partner sticker in one grid without partner filters', () => {
  const { container } = render(<PartnerEmojiPicker onSelect={vi.fn()} />)

  expect(container.querySelectorAll('.grid > button')).toHaveLength(
    REWIND_PERSONAS.length * PARTNER_EMOTIONS.length,
  )
  expect(screen.queryByRole('button', { name: 'Ella emojis' })).toBeNull()
  expect(
    screen.getByRole('button', { name: 'Send Neeja cheering sticker' }),
  ).toBeTruthy()
})

it('moves recently selected stickers to the top and records selection', () => {
  const recent = { partnerId: 'tobi', emotion: 'cheering' } as const
  const selectSticker = vi.fn()
  localStorage.setItem(
    'vybaa.rewind.recent-stickers.v1',
    JSON.stringify([partnerEmojiToken(recent)]),
  )

  render(<PartnerEmojiPicker onSelect={selectSticker} />)
  expect(
    screen.getByRole('button', { name: 'Send Tobi cheering sticker' }),
  ).toBeTruthy()

  const newlyUsedSticker = { partnerId: 'ella', emotion: 'thinking' } as const
  fireEvent.click(
    screen.getByRole('button', { name: 'Send Ella thinking sticker' }),
  )
  expect(selectSticker).toHaveBeenCalledWith(newlyUsedSticker)
  const storedRecents = localStorage.getItem('vybaa.rewind.recent-stickers.v1')
  expect(storedRecents).not.toBeNull()
  expect(JSON.parse(storedRecents ?? '[]')).toEqual([
    partnerEmojiToken(newlyUsedSticker),
    partnerEmojiToken(recent),
  ])
})
