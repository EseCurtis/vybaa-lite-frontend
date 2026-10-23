import type { FlexxStats } from '@/components/custom/flexx/flexx-card.component'
import type { RewindInsights } from '@/shared/api/rewind.api'
import { metricValue } from './flexx-design'
import type { FlexxDesign } from './flexx-design'

export function meaningfulFlexxDesigns(
  designs: readonly FlexxDesign[],
  stats: FlexxStats | undefined,
  rewind: RewindInsights | undefined,
  hasAchievement: boolean | undefined,
): FlexxDesign[] {
  return designs.flatMap((design) => {
    if (design.questionnaire) return [design]
    if (design.category === 'achievement')
      return hasAchievement === false ? [] : [design]
    // Pending/failed sections keep their existing skeleton and local retry UI.
    if (!stats && design.category !== 'rewind') return [design]
    if (!rewind && design.category === 'rewind') return [design]
    const blocks = design.blocks.filter((block) => {
      const item = metricValue(block.metric, stats ?? EMPTY_STATS, rewind)
      return (
        Number.isFinite(item.value) &&
        item.value > 0 &&
        (!item.percentage || Math.round(item.value) > 0)
      )
    })
    if (!blocks.some((block) => block.slot === 'hero')) return []
    return [{ ...design, blocks }]
  })
}

const EMPTY_STATS: FlexxStats = {
  totalGoals: 0,
  totalCheckIns: 0,
  currentStreak: 0,
  longestStreak: 0,
  completionRate: 0,
  averageProgress: 0,
}
