import type { RewindExpression } from '@/shared/rewind/rewind-expressions'
import type { FlexxDesign } from './flexx-design'

export type FlexxLoop = 'headline' | 'metric' | 'none' | 'symbol'
export type FlexxPresentation = {
  loop: FlexxLoop
  expression: RewindExpression | null
}

function compositionSeed(id: string): number {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  return hash
}

export function flexxPresentation(design: FlexxDesign): FlexxPresentation {
  const seed = compositionSeed(design.id)
  if (design.questionnaire)
    return {
      loop: 'none',
      expression: seed % 2 ? 'thinking' : 'listening',
    }
  const loops: readonly FlexxLoop[] = ['symbol', 'metric', 'headline', 'none']
  const loop = loops[seed % loops.length] ?? 'none'
  // Dense grids and rings retain their space; portraits get a real layout slot.
  const hasPortraitSpace =
    ['billboard', 'statement', 'emblem'].includes(design.layout) &&
    seed % 3 === 0
  if (!hasPortraitSpace) return { loop, expression: null }
  const expressions: Record<FlexxDesign['category'], RewindExpression> = {
    achievement: 'cheering',
    daily: 'calm',
    rewind: 'listening',
    streak: 'cheering',
    weekly: 'thinking',
  }
  return { loop, expression: expressions[design.category] }
}
