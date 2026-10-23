import type { FlexxStats } from '@/components/custom/flexx/flexx-card.component'
import type { RewindInsights } from '@/shared/api/rewind.api'
import type { FlexxDesign } from './flexx-design'

export function flexxStorySeed(id: string): number {
  let seed = 0
  for (const character of id) seed = (seed * 31 + character.charCodeAt(0)) >>> 0
  return seed
}

export type FlexxStory = { title: string; text: string; source: string }

// Facts are bound to this viewer's data, never invented by the shared AI batch.
export function flexxStory(
  design: FlexxDesign,
  stats: FlexxStats,
  rewind?: RewindInsights | null,
): FlexxStory | null {
  if (design.questionnaire || design.category === 'achievement') return null
  const seed = flexxStorySeed(design.id)
  if (seed % 3 === 0) return null
  const facts: FlexxStory[] = []
  if (design.category === 'rewind') {
    const count = rewind?.coverage.completedSessions
    if (typeof count === 'number' && Number.isFinite(count) && count > 0)
      facts.push(
        {
          title: 'A little lore about you',
          text: `You made room for ${count} completed Rewind${count === 1 ? '' : 's'} in this view. The plot gets a pause button.`,
          source: 'Your Rewind history · last 7 days',
        },
        {
          title: 'Keeping this receipt',
          text: `${count} Rewind${count === 1 ? '' : 's'} completed. A little space to hear yourself, without needing a perfect speech.`,
          source: 'Your Rewind history · last 7 days',
        },
      )
  } else {
    if (Number.isFinite(stats.totalCheckIns) && stats.totalCheckIns > 0)
      facts.push(
        {
          title: 'The receipts are here',
          text: `${stats.totalCheckIns} check-in${stats.totalCheckIns === 1 ? '' : 's'} recorded. Tiny actions, with actual receipts. I like this subplot.`,
          source: 'Your recorded task check-ins',
        },
        {
          title: 'A very small standing ovation',
          text: `${stats.totalCheckIns} check-in${stats.totalCheckIns === 1 ? '' : 's'}. Please imagine me clapping with unnecessarily tiny hands.`,
          source: 'Your recorded task check-ins',
        },
      )
    if (Number.isFinite(stats.currentStreak) && stats.currentStreak > 1)
      facts.push({
        title: 'Okay, I see the rhythm',
        text: `Your current streak is ${stats.currentStreak} days. No dramatic montage required. Just you, showing up.`,
        source: 'Your current task streak',
      })
    if (Number.isFinite(stats.longestStreak) && stats.longestStreak > 1)
      facts.push({
        title: 'From your personal archives',
        text: `Your longest recorded streak: ${stats.longestStreak} days. Not a demand to beat it. Just a little fact worth keeping.`,
        source: 'Your longest recorded task streak',
      })
    if (Number.isFinite(stats.totalGoals) && stats.totalGoals > 0)
      facts.push({
        title: 'The plot has a to-do list',
        text: `${stats.totalGoals} task${stats.totalGoals === 1 ? '' : 's'} in your task summary. Which one gets the main-character moment next?`,
        source: 'Your task summary',
      })
  }
  if (!facts.length) return null
  return facts[Math.floor(seed / 3) % facts.length] ?? null
}
