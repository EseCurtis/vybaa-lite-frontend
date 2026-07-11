import type { RewindGuidedQuestionId } from '@/shared/api/rewind.api'

export const ALL_DAYS_FILTER = 'all'
export const ALL_PARTNERS_FILTER = 'all'
export const REWIND_PROMPT_COUNT = 5

export const RESPONSE_LABELS: Record<RewindGuidedQuestionId, string> = {
  meaningful: 'Meaningful',
  draining: 'Draining',
  progress: 'Progress',
  different: 'Different',
  tomorrow_need: 'Tomorrow',
}
