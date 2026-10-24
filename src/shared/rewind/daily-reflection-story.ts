import type { DailyReflection } from '@/shared/api/reflections.api'
import type { PartnerEmotion } from '@/shared/rewind/partner-emojis'

export type ReflectionTone = 'amber' | 'green' | 'muted' | 'pink'
export type ReflectionSourceSymbol = 'award' | 'book' | 'chat' | 'feed' | 'task'
export interface ReflectionActivity {
  label: string
  count: number
  tone: ReflectionTone
  symbol: ReflectionSourceSymbol
}

const SOURCES: Readonly<Record<string, Omit<ReflectionActivity, 'count'>>> = {
  ACHIEVEMENT: { label: 'Achievements', tone: 'amber', symbol: 'award' },
  FLEXX: { label: 'Feed', tone: 'pink', symbol: 'feed' },
  FLEXX_ANSWER: { label: 'Feed answers', tone: 'pink', symbol: 'feed' },
  GOAL: { label: 'Tasks', tone: 'green', symbol: 'task' },
  JOURNAL: { label: 'Journal', tone: 'amber', symbol: 'book' },
  REWARD: { label: 'Rewards', tone: 'amber', symbol: 'award' },
  REWIND_CHAT: { label: 'Conversations', tone: 'pink', symbol: 'chat' },
  REWIND_ROUTINE: { label: 'Rewind', tone: 'green', symbol: 'chat' },
  REWIND_VOICE: { label: 'Rewind', tone: 'green', symbol: 'chat' },
}

export function reflectionActivities(
  counts: DailyReflection['sourceCounts'],
): ReflectionActivity[] {
  const entries = Object.entries(counts).filter(
    ([, count]) => Number.isSafeInteger(count) && count > 0,
  )
  const labels = [
    ...new Set(entries.map(([source]) => SOURCES[source]?.label ?? 'Activity')),
  ]
  return labels.map((label) => {
    const matching = entries.filter(
      ([source]) => (SOURCES[source]?.label ?? 'Activity') === label,
    )
    let count = 0
    for (const [, value] of matching) count += value
    const source = matching[0]?.[0]
    const presentation = source ? SOURCES[source] : undefined
    return {
      label,
      count,
      tone: presentation?.tone ?? 'muted',
      symbol: presentation?.symbol ?? 'feed',
    }
  })
}

export function reflectionStoryVariation(
  seed: string,
  index = 0,
): {
  layout: 'aside' | 'note' | 'open'
  tone: ReflectionTone
  emotion: PartnerEmotion
  rotation: number
} {
  let hash = 2166136261
  for (const character of `${seed}:${index}`)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  const value = hash >>> 0
  const layouts = ['open', 'note', 'aside'] as const
  const tones: ReflectionTone[] = ['pink', 'green', 'amber']
  const emotions: PartnerEmotion[] = ['listening', 'thinking', 'love']
  return {
    layout: layouts[value % layouts.length] ?? 'open',
    tone: tones[(value >>> 3) % tones.length] ?? 'pink',
    emotion: emotions[(value >>> 6) % emotions.length] ?? 'listening',
    rotation: ((value >>> 9) % 5) - 2,
  }
}

export function reflectionSummaryPassages(summary: string): string[] {
  const paragraphs = summary
    .trim()
    .split(/\n\s*\n/u)
    .filter(Boolean)
  if (paragraphs.length !== 1) return paragraphs
  if (typeof Intl.Segmenter !== 'function') return paragraphs
  const sentences = [
    ...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(
      paragraphs[0],
    ),
  ]
  const passages: string[] = []
  let passage = ''
  for (const { segment } of sentences) {
    passage += segment
    if (passage.length >= 160) {
      passages.push(passage.trim())
      passage = ''
    }
  }
  if (passage.trim()) passages.push(passage.trim())
  return passages
}
