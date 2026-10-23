export const REWIND_CHAT_ACCENTS = [
  { id: 'rose', label: 'Rose', value: '#CC004A' },
  { id: 'violet', label: 'Violet', value: '#5B4A9E' },
  { id: 'amber', label: 'Amber', value: '#A65316' },
  { id: 'teal', label: 'Teal', value: '#19766B' },
  { id: 'blue', label: 'Blue', value: '#316BC7' },
  { id: 'berry', label: 'Berry', value: '#A33C58' },
] as const

export type RewindChatAccentId = (typeof REWIND_CHAT_ACCENTS)[number]['id']

export const DEFAULT_REWIND_CHAT_ACCENT: RewindChatAccentId = 'rose'

export function isRewindChatAccentId(
  value: unknown,
): value is RewindChatAccentId {
  return REWIND_CHAT_ACCENTS.some((accent) => accent.id === value)
}

export function getRewindChatAccent(value: unknown) {
  return (
    REWIND_CHAT_ACCENTS.find((accent) => accent.id === value) ??
    REWIND_CHAT_ACCENTS[0]
  )
}
