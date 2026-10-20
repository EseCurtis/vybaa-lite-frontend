import { describe, expect, it } from 'vitest'
import {
  PARTNER_EMOTIONS,
  parsePartnerEmoji,
  partnerEmojiToken,
  messageEmojiEmotion,
} from './partner-emojis'
import { REWIND_PERSONAS } from './rewind-personas'

describe('partner emoji messages', () => {
  it('round trips every supported identity and expression through existing text messages', () => {
    for (const partner of REWIND_PERSONAS) {
      for (const emotion of PARTNER_EMOTIONS) {
        const emoji = { partnerId: partner.id, emotion }
        expect(parsePartnerEmoji(partnerEmojiToken(emoji))).toEqual(emoji)
      }
    }
  })
  it('leaves unsupported tokens and ordinary text intact', () => {
    for (const value of [
      ':vybaa/unknown/love:',
      ':vybaa/ella/unknown:',
      ':vybaa/../../love:',
      'hello',
      ':vybaa/ella/love: extra',
    ]) {
      expect(parsePartnerEmoji(value)).toBeNull()
    }
    expect(messageEmojiEmotion('😢')).toBeNull()
    expect(messageEmojiEmotion('😂')).toBe('laughing')
  })
})
