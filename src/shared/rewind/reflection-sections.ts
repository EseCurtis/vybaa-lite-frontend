import type { RewindSession } from '@/shared/api/rewind.api'

export type ReflectionDetailSection =
  | 'conversation'
  | 'journal'
  | 'observation'
  | 'reflection'

export function hasReflectionSummary(
  session: Pick<RewindSession, 'personaId' | 'summary'>,
): boolean {
  const summary = session.summary.trim()
  return (
    Boolean(summary) &&
    summary !== 'This scheduled Rewind has not started yet.' &&
    !/^This Rewind with .+ was started, but no reflection was captured yet\.$/.test(
      summary,
    )
  )
}

export function availableReflectionSections(
  session: RewindSession,
): ReflectionDetailSection[] {
  if (
    session.status === 'MISSED' ||
    session.status === 'SCHEDULED' ||
    session.status === 'FINALIZING'
  )
    return []
  const sections: ReflectionDetailSection[] = []
  if (session.turns?.some((turn) => turn.content.trim()))
    sections.push('conversation')
  if (
    hasReflectionSummary(session) ||
    session.emotionalInsight?.trim() ||
    session.comparisonInsight?.trim()
  )
    sections.push('reflection')
  const observation = session.dailyObservation
  if (
    observation &&
    (observation.description.trim() ||
      observation.reflection?.trim() ||
      observation.observations.some((value) => value.trim()))
  )
    sections.push('observation')
  if (session.journalDraft?.trim()) sections.push('journal')
  return sections
}
