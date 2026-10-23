import {
  messageEmojiEmotion,
  parsePartnerEmoji,
  PARTNER_EMOJI_PATTERN,
} from '@/shared/rewind/partner-emojis'
import type { PartnerEmotion } from '@/shared/rewind/partner-emojis'

/** A quiet, attentive expression is safer than inventing a mood for ambiguous copy. */
export function homeGreetingEmotion(
  message: string,
  title = '',
  emoji = '',
): PartnerEmotion {
  const text = `${title} ${message}`.toLowerCase().replaceAll('’', "'")
  if (
    /\b(struggl\w*|overwhelm\w*|exhaust\w*|griev\w*|lonely|anxious|anxiety|stressed|rough|tough|difficult|drained|hurt\w*|sad|quiet|missed|miss you|holding up|carrying|carry it|not okay|not ok|not feeling|not proud|no wins|no win|no progress|nothing to celebrate|fell behind|falling behind|didn't|haven't|couldn't|can't|failed|lost|down)\b/u.test(
      text,
    )
  )
    return 'listening'
  if (
    /\b(proud|well done|you did it|you've done it|you made it|nailed it|celebrat\w*|you finished|you completed|small win|kept showing up|you kept going|you protected|you showed up|your effort|you've got this|keep going|keep moving|keep it going|keep building|keep showing|keep your streak|one step|small steps|little progress|fresh progress)\b/u.test(
      text,
    )
  )
    return 'cheering'
  if (
    /\b(lol|lmao|vibing|gist|survived|still alive|u alive|hanging)\b/u.test(
      text,
    ) ||
    /😂|🤣/u.test(text)
  )
    return 'laughing'
  if (
    /\b(avoiding|be honest|excuses|truth check|did you actually|say it plainly|you know the problem)\b/u.test(
      text,
    )
  )
    return 'skeptical'
  if (
    /\b(here for you|here if|with you|thinking abt you|thinking about you|we'll sort|good to see you|show up for yourself)\b/u.test(
      text,
    ) ||
    /💗|🤎|🫶|🥰|❤️/u.test(text)
  )
    return 'love'
  for (const match of `${title} ${message}`.matchAll(PARTNER_EMOJI_PATTERN)) {
    const emotion =
      parsePartnerEmoji(match[0])?.emotion ?? messageEmojiEmotion(match[0])
    if (emotion) return emotion
  }
  if (
    /\b(what|how|why|wonder|reflect|noticed|mind|story|situation|focus|begin|learn|figuring)\b/u.test(
      text,
    )
  )
    return 'thinking'
  return messageEmojiEmotion(emoji) ?? 'listening'
}
