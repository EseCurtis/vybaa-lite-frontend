import type { RewindPersonaId } from './rewind-personas'

export const REWIND_EXPRESSIONS = [
  'thinking',
  'typing',
  'cheering',
  'laughing',
  'surprised',
  'listening',
  'skeptical',
  'calm',
] as const

export type RewindExpression = (typeof REWIND_EXPRESSIONS)[number]

export function rewindExpressionAsset(
  partnerId: RewindPersonaId,
  expression: RewindExpression,
): string {
  return `/assets/rewind/expressions/v1/${partnerId}/${expression}.webp`
}
